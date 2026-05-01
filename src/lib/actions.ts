"use server";

import { db } from "@/db";
import {
  patients,
  appointments,
  prescriptions,
  growthRecords,
  vaccinationRecords,
  parentPatients,
  doctorAvailability,
  users,
  visitSummaries,
  growthPredictions,
  appointmentActivities,
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { sriLankaEPISchedule, computeDueDate } from "@/data/sri-lanka-epi";
import { computeZScores, getLMS } from "@/lib/who-lms";
import { callGemini } from "@/lib/ai/gemini";

// ─── Helper: get session user with medicalRole ─────────────────────────────────

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user as {
    id: string;
    name: string;
    email: string;
    role: "parent" | "medical_professional";
    medicalRole?: "pediatrician" | "midwife";
  };
}

// ─── Patients ──────────────────────────────────────────────────────────────────

export async function createPatient(formData: FormData) {
  const user = await getSessionUser();

  const name = formData.get("name") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const gender = formData.get("gender") as "male" | "female";
  const bloodType = (formData.get("bloodType") as string) || "Unknown";
  const parentId = formData.get("parentId") as string;

  if (!name || !dateOfBirth || !gender) {
    throw new Error("Missing required fields");
  }

  const finalParentId =
    user.role === "parent" ? user.id : parentId;

  if (!finalParentId) {
    throw new Error("Parent is required");
  }

  // Insert patient first
  const [patient] = await db
    .insert(patients)
    .values({
      name,
      dateOfBirth,
      gender,
      bloodType: bloodType as "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "Unknown",
    })
    .returning();

  // Link to parent via junction table
  await db.insert(parentPatients).values({
    parentId: finalParentId,
    patientId: patient.id,
  });

  // Auto-create vaccination schedule from Sri Lanka EPI
  const vaccineRecords = sriLankaEPISchedule.map((entry) => ({
    patientId: patient.id,
    vaccineName: entry.vaccineName,
    dueDate: computeDueDate(dateOfBirth, entry.dueAgeWeeks),
  }));

  if (vaccineRecords.length > 0) {
    await db.insert(vaccinationRecords).values(vaccineRecords);
  }

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

export async function updatePatient(id: string, formData: FormData) {
  const user = await getSessionUser();

  const name = formData.get("name") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const gender = formData.get("gender") as "male" | "female";
  const bloodType = (formData.get("bloodType") as string) || "Unknown";

  if (!name || !dateOfBirth || !gender) {
    throw new Error("Missing required fields");
  }

  // Parents can only update their own children
  if (user.role === "parent") {
    const links = await db
      .select()
      .from(parentPatients)
      .where(
        and(eq(parentPatients.parentId, user.id), eq(parentPatients.patientId, id)),
      );
    if (links.length === 0) throw new Error("Unauthorized");
  }

  await db
    .update(patients)
    .set({
      name,
      dateOfBirth,
      gender,
      bloodType: bloodType as "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "Unknown",
    })
    .where(eq(patients.id, id));

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
  revalidatePath(`/patients/${id}`);
}

export async function deletePatient(id: string) {
  const user = await getSessionUser();

  // Parents can only delete their own children
  if (user.role === "parent") {
    const links = await db
      .select()
      .from(parentPatients)
      .where(
        and(eq(parentPatients.parentId, user.id), eq(parentPatients.patientId, id)),
      );
    if (links.length === 0) throw new Error("Unauthorized");
  }

  await db.delete(patients).where(eq(patients.id, id));

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

// ─── Appointments ────────────────────────────────────────────────────────────

export async function createAppointment(formData: FormData) {
  const user = await getSessionUser();
  if (user.role !== "parent") {
    throw new Error("Only parents can book appointments");
  }

  const patientId = formData.get("patientId") as string;
  const doctorId = formData.get("doctorId") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const type = formData.get("type") as "Routine" | "Vaccination" | "Follow-up";
  const notes = (formData.get("notes") as string) || null;

  if (!patientId || !doctorId || !date || !time || !type) {
    throw new Error("Missing required fields");
  }

  // Verify parent is linked to this patient
  const links = await db
    .select()
    .from(parentPatients)
    .where(
      and(eq(parentPatients.parentId, user.id), eq(parentPatients.patientId, patientId)),
    );
  if (links.length === 0) throw new Error("You are not authorized to book for this patient");

  // Verify doctor is a pediatrician
  const docRows = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, doctorId),
        eq(users.role, "medical_professional"),
        eq(users.medicalRole, "pediatrician"),
      ),
    );
  if (docRows.length === 0) throw new Error("Selected doctor is not a pediatrician");

  await db.insert(appointments).values({
    patientId,
    doctorId,
    date,
    time,
    type,
    status: "pending",
    notes,
  });

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

export async function confirmAppointment(id: string) {
  const user = await getSessionUser();
  if (user.role !== "medical_professional" || user.medicalRole !== "pediatrician") {
    throw new Error("Only pediatricians can confirm appointments");
  }

  await db
    .update(appointments)
    .set({ status: "upcoming", confirmedById: user.id })
    .where(eq(appointments.id, id));

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

export async function updateAppointmentStatus(
  id: string,
  status: "pending" | "upcoming" | "completed" | "cancelled"
) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  await db
    .update(appointments)
    .set({ status })
    .where(eq(appointments.id, id));

  // Auto-generate visit summary when appointment is completed
  if (status === "completed") {
    try {
      await generateVisitSummary(id);
    } catch {
      // Non-blocking: summary generation should not fail the status update
    }
  }

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

export async function completeAppointmentWithActivities(
  appointmentId: string,
  activities: {
    type: "vaccine_administered" | "prescription_started" | "prescription_continued" | "prescription_stopped" | "growth_measured" | "general_note" | "custom";
    description: string;
    metadata?: string;
  }[]
) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  // Insert all activities
  if (activities.length > 0) {
    await db.insert(appointmentActivities).values(
      activities.map((a) => ({
        appointmentId,
        type: a.type,
        description: a.description,
        metadata: a.metadata || null,
      }))
    );
  }

  // Mark appointment as completed
  await db
    .update(appointments)
    .set({ status: "completed" })
    .where(eq(appointments.id, appointmentId));

  // Generate visit summary based on logged activities
  try {
    await generateVisitSummary(appointmentId);
  } catch {
    // Non-blocking: summary generation should not fail the completion
  }

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
  revalidatePath(`/patients/${appointmentId}`);
}

export async function updateAppointment(id: string, formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const type = formData.get("type") as "Routine" | "Vaccination" | "Follow-up";
  const notes = (formData.get("notes") as string) || null;

  if (!date || !time || !type) {
    throw new Error("Missing required fields");
  }

  await db
    .update(appointments)
    .set({ date, time, type, notes })
    .where(eq(appointments.id, id));

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

export async function deleteAppointment(id: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  await db.delete(appointments).where(eq(appointments.id, id));

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

// ─── Doctor Availability ───────────────────────────────────────────────────────

export async function setDoctorAvailability(
  slots: { dayOfWeek: number; startTime: string; endTime: string }[]
) {
  const user = await getSessionUser();
  if (user.role !== "medical_professional" || user.medicalRole !== "pediatrician") {
    throw new Error("Only pediatricians can set availability");
  }

  // Delete existing availability for this doctor
  await db.delete(doctorAvailability).where(eq(doctorAvailability.doctorId, user.id));

  // Insert new slots
  if (slots.length > 0) {
    await db.insert(doctorAvailability).values(
      slots.map((s) => ({ doctorId: user.id, ...s }))
    );
  }

  revalidatePath("/medical-professional");
}

// ─── Prescriptions ───────────────────────────────────────────────────────────

export async function createPrescription(formData: FormData) {
  const user = await getSessionUser();
  if (user.role !== "medical_professional") {
    throw new Error("Unauthorized");
  }

  const patientId = formData.get("patientId") as string;
  const medication = formData.get("medication") as string;
  const dosage = formData.get("dosage") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = (formData.get("endDate") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!patientId || !medication || !dosage || !startDate) {
    throw new Error("Missing required fields");
  }

  await db.insert(prescriptions).values({
    patientId,
    doctorId: user.id,
    medication,
    dosage,
    startDate,
    endDate,
    status: "active",
    notes,
  });

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

export async function updatePrescriptionStatus(
  id: string,
  status: "active" | "pending" | "completed" | "cancelled"
) {
  const user = await getSessionUser();
  if (user.role !== "medical_professional") {
    throw new Error("Unauthorized");
  }

  await db
    .update(prescriptions)
    .set({ status })
    .where(eq(prescriptions.id, id));

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

export async function updatePrescription(id: string, formData: FormData) {
  const user = await getSessionUser();
  if (user.role !== "medical_professional") {
    throw new Error("Unauthorized");
  }

  const medication = formData.get("medication") as string;
  const dosage = formData.get("dosage") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = (formData.get("endDate") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!medication || !dosage || !startDate) {
    throw new Error("Missing required fields");
  }

  await db
    .update(prescriptions)
    .set({ medication, dosage, startDate, endDate, notes })
    .where(eq(prescriptions.id, id));

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

export async function deletePrescription(id: string) {
  const user = await getSessionUser();
  if (user.role !== "medical_professional") {
    throw new Error("Unauthorized");
  }

  await db.delete(prescriptions).where(eq(prescriptions.id, id));

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

// ─── Growth Records ──────────────────────────────────────────────────────────

export async function createGrowthRecord(formData: FormData) {
  const user = await getSessionUser();
  if (user.role !== "medical_professional") {
    throw new Error("Unauthorized");
  }

  const patientId = formData.get("patientId") as string;
  const date = formData.get("date") as string;
  const weightKg = parseFloat(formData.get("weightKg") as string);
  const heightCm = parseFloat(formData.get("heightCm") as string);

  if (
    !patientId ||
    !date ||
    Number.isNaN(weightKg) ||
    Number.isNaN(heightCm)
  ) {
    throw new Error("Missing or invalid fields");
  }

  // Compute age in weeks from patient's date of birth
  const [patientRow] = await db
    .select({ dateOfBirth: patients.dateOfBirth, gender: patients.gender })
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);

  if (!patientRow) {
    throw new Error("Patient not found");
  }

  const dob = new Date(patientRow.dateOfBirth);
  const recordDate = new Date(date);
  const diffMs = recordDate.getTime() - dob.getTime();
  const ageInWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));

  // Compute WHO Z-scores
  const zScores = computeZScores(
    patientRow.gender as "male" | "female",
    ageInWeeks,
    weightKg,
    heightCm
  );

  await db.insert(growthRecords).values({
    patientId,
    date,
    weightKg,
    heightCm,
    ageInWeeks,
    weightForAgeZScore: zScores.weightForAgeZScore,
    heightForAgeZScore: zScores.heightForAgeZScore,
    recordedById: user.id,
  });

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

export async function updateGrowthRecord(id: string, formData: FormData) {
  const user = await getSessionUser();
  if (user.role !== "medical_professional") {
    throw new Error("Unauthorized");
  }

  const date = formData.get("date") as string;
  const weightKg = parseFloat(formData.get("weightKg") as string);
  const heightCm = parseFloat(formData.get("heightCm") as string);
  const ageInWeeks = parseInt(formData.get("ageInWeeks") as string, 10);

  if (
    !date ||
    Number.isNaN(weightKg) ||
    Number.isNaN(heightCm) ||
    Number.isNaN(ageInWeeks)
  ) {
    throw new Error("Missing or invalid fields");
  }

  // Fetch patient gender to recompute z-scores
  const [recordRow] = await db
    .select({ patientId: growthRecords.patientId })
    .from(growthRecords)
    .where(eq(growthRecords.id, id))
    .limit(1);

  let weightForAgeZScore: number | null = null;
  let heightForAgeZScore: number | null = null;

  if (recordRow) {
    const [patientRow] = await db
      .select({ gender: patients.gender })
      .from(patients)
      .where(eq(patients.id, recordRow.patientId))
      .limit(1);

    if (patientRow) {
      const zScores = computeZScores(
        patientRow.gender as "male" | "female",
        ageInWeeks,
        weightKg,
        heightCm
      );
      weightForAgeZScore = zScores.weightForAgeZScore;
      heightForAgeZScore = zScores.heightForAgeZScore;
    }
  }

  await db
    .update(growthRecords)
    .set({ date, weightKg, heightCm, ageInWeeks, weightForAgeZScore, heightForAgeZScore })
    .where(eq(growthRecords.id, id));

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

export async function deleteGrowthRecord(id: string) {
  const user = await getSessionUser();
  if (user.role !== "medical_professional") {
    throw new Error("Unauthorized");
  }

  await db.delete(growthRecords).where(eq(growthRecords.id, id));

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

// ─── Vaccination Records ─────────────────────────────────────────────────────

export async function createVaccinationRecord(formData: FormData) {
  const user = await getSessionUser();
  if (user.role !== "medical_professional") {
    throw new Error("Unauthorized");
  }

  const patientId = formData.get("patientId") as string;
  const vaccineName = formData.get("vaccineName") as string;
  const dueDate = formData.get("dueDate") as string;

  if (!patientId || !vaccineName || !dueDate) {
    throw new Error("Missing required fields");
  }

  await db.insert(vaccinationRecords).values({
    patientId,
    vaccineName,
    dueDate,
    administeredById: user.id,
  });

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

export async function updateVaccinationRecord(id: string, formData: FormData) {
  const user = await getSessionUser();
  if (user.role !== "medical_professional") {
    throw new Error("Unauthorized");
  }

  const dueDate = formData.get("dueDate") as string;
  const administeredDate = (formData.get("administeredDate") as string) || null;
  const batchNumber = (formData.get("batchNumber") as string) || null;
  const clinic = (formData.get("clinic") as string) || null;

  if (!dueDate) {
    throw new Error("Missing required fields");
  }

  await db
    .update(vaccinationRecords)
    .set({ dueDate, administeredDate, batchNumber, clinic })
    .where(eq(vaccinationRecords.id, id));

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

export async function markVaccineAdministered(
  id: string,
  administeredDate: string,
  batchNumber?: string,
  clinic?: string,
) {
  const user = await getSessionUser();
  if (user.role !== "medical_professional") {
    throw new Error("Unauthorized");
  }

  await db
    .update(vaccinationRecords)
    .set({
      administeredDate,
      administeredById: user.id,
      batchNumber: batchNumber || null,
      clinic: clinic || null,
    })
    .where(eq(vaccinationRecords.id, id));

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

export async function deleteVaccinationRecord(id: string) {
  const user = await getSessionUser();
  if (user.role !== "medical_professional") {
    throw new Error("Unauthorized");
  }

  await db.delete(vaccinationRecords).where(eq(vaccinationRecords.id, id));

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
}

// ─── AI: Growth Insights ─────────────────────────────────────────────────────

export interface GrowthAnomaly {
  type: "weight_faltering" | "height_faltering" | "sudden_drop" | "crossing_percentile";
  severity: "warning" | "risk";
  message: string;
  recordIndex: number;
}

export interface GrowthInsight {
  anomalies: GrowthAnomaly[];
  explanation: string | null;
  zScores: {
    date: string;
    ageInWeeks: number;
    weightKg: number;
    heightCm: number;
    weightForAgeZScore: number | null;
    heightForAgeZScore: number | null;
    weightStatus: "normal" | "warning" | "risk";
    heightStatus: "normal" | "warning" | "risk";
  }[];
}

export async function generateGrowthInsights(
  patientId: string,
  role: "parent" | "medical_professional"
): Promise<GrowthInsight> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch patient
  const [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);

  if (!patient) throw new Error("Patient not found");

  // Fetch growth records
  const records = await db
    .select()
    .from(growthRecords)
    .where(eq(growthRecords.patientId, patientId))
    .orderBy(growthRecords.date);

  if (records.length === 0) {
    return { anomalies: [], explanation: null, zScores: [] };
  }

  // Build z-score data and detect anomalies
  const zScores = records.map((r) => {
    const zs = computeZScores(
      patient.gender as "male" | "female",
      r.ageInWeeks,
      r.weightKg,
      r.heightCm
    );
    return {
      date: r.date,
      ageInWeeks: r.ageInWeeks,
      weightKg: r.weightKg,
      heightCm: r.heightCm,
      weightForAgeZScore: zs.weightForAgeZScore,
      heightForAgeZScore: zs.heightForAgeZScore,
      weightStatus: zs.weightStatus,
      heightStatus: zs.heightStatus,
    };
  });

  const anomalies: GrowthAnomaly[] = [];

  for (let i = 0; i < zScores.length; i++) {
    const curr = zScores[i];

    // Check for warning/risk on current record
    if (curr.weightStatus === "risk") {
      anomalies.push({
        type: "weight_faltering",
        severity: "risk",
        message: `Weight-for-age Z-score is severely low (${curr.weightForAgeZScore?.toFixed(1)}) at ${curr.ageInWeeks} weeks.`,
        recordIndex: i,
      });
    } else if (curr.weightStatus === "warning") {
      anomalies.push({
        type: "weight_faltering",
        severity: "warning",
        message: `Weight-for-age Z-score is below normal (${curr.weightForAgeZScore?.toFixed(1)}) at ${curr.ageInWeeks} weeks.`,
        recordIndex: i,
      });
    }

    if (curr.heightStatus === "risk") {
      anomalies.push({
        type: "height_faltering",
        severity: "risk",
        message: `Height-for-age Z-score is severely low (${curr.heightForAgeZScore?.toFixed(1)}) at ${curr.ageInWeeks} weeks.`,
        recordIndex: i,
      });
    } else if (curr.heightStatus === "warning") {
      anomalies.push({
        type: "height_faltering",
        severity: "warning",
        message: `Height-for-age Z-score is below normal (${curr.heightForAgeZScore?.toFixed(1)}) at ${curr.ageInWeeks} weeks.`,
        recordIndex: i,
      });
    }

    // Check for sudden drop between consecutive records
    if (i > 0) {
      const prev = zScores[i - 1];
      if (curr.weightForAgeZScore !== null && prev.weightForAgeZScore !== null) {
        const drop = prev.weightForAgeZScore - curr.weightForAgeZScore;
        if (drop > 1.5) {
          anomalies.push({
            type: "sudden_drop",
            severity: drop > 2.5 ? "risk" : "warning",
            message: `Sudden weight decline: Z-score dropped by ${drop.toFixed(1)} from ${prev.ageInWeeks}w to ${curr.ageInWeeks}w.`,
            recordIndex: i,
          });
        }
      }
      if (curr.heightForAgeZScore !== null && prev.heightForAgeZScore !== null) {
        const drop = prev.heightForAgeZScore - curr.heightForAgeZScore;
        if (drop > 1.5) {
          anomalies.push({
            type: "sudden_drop",
            severity: drop > 2.5 ? "risk" : "warning",
            message: `Sudden height decline: Z-score dropped by ${drop.toFixed(1)} from ${prev.ageInWeeks}w to ${curr.ageInWeeks}w.`,
            recordIndex: i,
          });
        }
      }
    }
  }

  // Call Gemini for explanation
  let explanation: string | null = null;

  if (anomalies.length > 0 && process.env.GEMINI_API_KEY) {
    const systemPrompt =
      role === "medical_professional"
        ? "You are a pediatric clinical assistant. Summarize growth anomalies in clinical language. Include differential considerations and recommended follow-up actions. Be concise (2-3 sentences)."
        : "You are a friendly health educator. Explain growth findings in simple, reassuring language that a parent can understand. Offer practical advice. Be concise (2-3 sentences).";

    const userContent = `Patient: ${patient.name}, ${patient.gender}, born ${patient.dateOfBirth}.

Growth measurements with WHO Z-scores:
${zScores
  .map(
    (z) =>
      `- ${z.date} (${z.ageInWeeks}w): Weight ${z.weightKg}kg (Z=${z.weightForAgeZScore?.toFixed(2) ?? "N/A"}), Height ${z.heightCm}cm (Z=${z.heightForAgeZScore?.toFixed(2) ?? "N/A"})`
  )
  .join("\n")}

Detected anomalies:
${anomalies.map((a) => `- ${a.severity.toUpperCase()}: ${a.message}`).join("\n")}

Please provide a brief summary of these findings.`;

    explanation = await callGemini(systemPrompt, userContent);
  }

  return { anomalies, explanation, zScores };
}

// ─── AI: Growth Trajectory Prediction ────────────────────────────────────────

export interface ProjectedRecord {
  ageInWeeks: number;
  projectedWeightKg: number;
  projectedHeightCm: number;
  weightZScore: number;
  heightZScore: number;
}

export interface GrowthPrediction {
  projectedRecords: ProjectedRecord[];
  percentileData: {
    ageInWeeks: number;
    p3: number;
    p15: number;
    p50: number;
    p85: number;
    p97: number;
  }[];
  trajectoryExplanation: string | null;
  createdAt?: string;
}

function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

async function _generateGrowthPrediction(
  patientId: string,
  role: "parent" | "medical_professional"
): Promise<GrowthPrediction> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);

  if (!patient) throw new Error("Patient not found");

  const records = await db
    .select()
    .from(growthRecords)
    .where(eq(growthRecords.patientId, patientId))
    .orderBy(growthRecords.date);

  if (records.length < 2) {
    return { projectedRecords: [], percentileData: [], trajectoryExplanation: null };
  }

  const gender = patient.gender as "male" | "female";

  // Build z-score data
  const zData = records.map((r) => {
    const zs = computeZScores(gender, r.ageInWeeks, r.weightKg, r.heightCm);
    return {
      ageInWeeks: r.ageInWeeks,
      weightZ: zs.weightForAgeZScore ?? 0,
      heightZ: zs.heightForAgeZScore ?? 0,
    };
  });

  // Linear regression on z-scores
  const weightRegression = linearRegression(zData.map((d) => ({ x: d.ageInWeeks, y: d.weightZ })));
  const heightRegression = linearRegression(zData.map((d) => ({ x: d.ageInWeeks, y: d.heightZ })));

  // Project next 6 months (26 weeks) in 4-week increments
  const lastAge = zData[zData.length - 1].ageInWeeks;
  const projectedRecords: ProjectedRecord[] = [];
  for (let weeks = 4; weeks <= 26; weeks += 4) {
    const futureAge = lastAge + weeks;
    const projectedWeightZ = weightRegression.slope * futureAge + weightRegression.intercept;
    const projectedHeightZ = heightRegression.slope * futureAge + heightRegression.intercept;

    // Convert projected z-scores back to raw values using WHO LMS
    const wLMS = computeZScores(gender, futureAge, 0, 0); // dummy to get LMS
    // We need the actual LMS entry, not z-scores. Let me import getLMS.
    // Actually, let me use the inverse formula: observed = M * (1 + L * S * z)^(1/L)
    // For L=1: observed = M * (1 + S * z)
    // This is an approximation for projection purposes.

    const wRef = getLMS(gender, futureAge, "weight");
    const hRef = getLMS(gender, futureAge, "height");

    let projectedWeightKg = 0;
    let projectedHeightCm = 0;

    if (wRef) {
      if (wRef.L === 0) {
        projectedWeightKg = wRef.M * Math.exp(wRef.S * projectedWeightZ);
      } else {
        projectedWeightKg = wRef.M * Math.pow(1 + wRef.L * wRef.S * projectedWeightZ, 1 / wRef.L);
      }
    }
    if (hRef) {
      if (hRef.L === 0) {
        projectedHeightCm = hRef.M * Math.exp(hRef.S * projectedHeightZ);
      } else {
        projectedHeightCm = hRef.M * Math.pow(1 + hRef.L * hRef.S * projectedHeightZ, 1 / hRef.L);
      }
    }

    projectedRecords.push({
      ageInWeeks: futureAge,
      projectedWeightKg: Math.round(projectedWeightKg * 100) / 100,
      projectedHeightCm: Math.round(projectedHeightCm * 100) / 100,
      weightZScore: Math.round(projectedWeightZ * 100) / 100,
      heightZScore: Math.round(projectedHeightZ * 100) / 100,
    });
  }

  // Build percentile reference lines for chart (P3, P15, P50, P85, P97)
  // Use the patient's actual age range + projected range
  const allAges = new Set<number>();
  records.forEach((r) => allAges.add(r.ageInWeeks));
  projectedRecords.forEach((p) => allAges.add(p.ageInWeeks));

  const sortedAges = Array.from(allAges).sort((a, b) => a - b);
  const percentileData = sortedAges.map((age) => {
    const wRef = getLMS(gender, age, "weight");
    const hRef = getLMS(gender, age, "height");

    const zToValue = (lms: { L: number; M: number; S: number } | null, z: number) => {
      if (!lms) return 0;
      if (lms.L === 0) return lms.M * Math.exp(lms.S * z);
      return lms.M * Math.pow(1 + lms.L * lms.S * z, 1 / lms.L);
    };

    return {
      ageInWeeks: age,
      p3: Math.round(zToValue(wRef, -1.88) * 100) / 100,
      p15: Math.round(zToValue(wRef, -1.04) * 100) / 100,
      p50: Math.round(zToValue(wRef, 0) * 100) / 100,
      p85: Math.round(zToValue(wRef, 1.04) * 100) / 100,
      p97: Math.round(zToValue(wRef, 1.88) * 100) / 100,
    };
  });

  // LLM explanation
  let trajectoryExplanation: string | null = null;
  if (process.env.GEMINI_API_KEY) {
    const systemPrompt =
      role === "medical_professional"
        ? "You are a pediatric clinical assistant. Describe the projected growth trajectory based on regression analysis of WHO Z-scores. Mention if the child is likely to remain on their current percentile curve or cross into a different risk category. Be concise (2-3 sentences)."
        : "You are a friendly health educator. Explain what the growth prediction means for the child in simple terms. Reassure parents while being honest about any concerns. Be concise (2-3 sentences).";

    const latest = records[records.length - 1];
    const latestZS = computeZScores(gender, latest.ageInWeeks, latest.weightKg, latest.heightCm);

    const userContent = `Patient: ${patient.name}, ${patient.gender}, ${latest.ageInWeeks} weeks old.

Latest measurement: Weight ${latest.weightKg}kg (Z=${latestZS.weightForAgeZScore?.toFixed(2) ?? "N/A"}), Height ${latest.heightCm}cm (Z=${latestZS.heightForAgeZScore?.toFixed(2) ?? "N/A"}).

Projected weight Z-scores over next 6 months: ${projectedRecords.map((p) => `${p.ageInWeeks}w: ${p.weightZScore}`).join(", ")}.
Projected height Z-scores over next 6 months: ${projectedRecords.map((p) => `${p.ageInWeeks}w: ${p.heightZScore}`).join(", ")}.

Please provide a brief trajectory summary.`;

    trajectoryExplanation = await callGemini(systemPrompt, userContent);
  }

  return { projectedRecords, percentileData, trajectoryExplanation };
}

export async function getGrowthPrediction(
  patientId: string,
  role: "parent" | "medical_professional",
  force?: boolean
): Promise<GrowthPrediction> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  if (!force) {
    // Check for cached prediction < 7 days old
    const [cached] = await db
      .select()
      .from(growthPredictions)
      .where(eq(growthPredictions.patientId, patientId))
      .orderBy(desc(growthPredictions.createdAt))
      .limit(1);

    if (cached) {
      const ageMs = Date.now() - new Date(cached.createdAt).getTime();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      if (ageMs < sevenDaysMs) {
        return {
          projectedRecords: JSON.parse(cached.projectedRecords),
          percentileData: JSON.parse(cached.percentileData),
          trajectoryExplanation: cached.trajectoryExplanation,
          createdAt: new Date(cached.createdAt).toISOString(),
        };
      }
    }
  }

  // Generate new prediction
  const prediction = await _generateGrowthPrediction(patientId, role);

  // Store in DB
  await db.insert(growthPredictions).values({
    patientId,
    projectedRecords: JSON.stringify(prediction.projectedRecords),
    percentileData: JSON.stringify(prediction.percentileData),
    trajectoryExplanation: prediction.trajectoryExplanation,
  });

  return {
    ...prediction,
    createdAt: new Date().toISOString(),
  };
}

// ─── AI: Merged Growth Analysis ──────────────────────────────────────────────

export interface GrowthAnalysis {
  anomalies: GrowthAnomaly[];
  zScores: GrowthInsight["zScores"];
  projectedRecords: ProjectedRecord[];
  percentileData: GrowthPrediction["percentileData"];
  combinedExplanation: string | null;
  trajectoryCreatedAt?: string;
}

export async function generateGrowthAnalysis(
  patientId: string,
  role: "parent" | "medical_professional",
  force = false
): Promise<GrowthAnalysis> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch patient
  const [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);
  if (!patient) throw new Error("Patient not found");

  // Fetch records
  const records = await db
    .select()
    .from(growthRecords)
    .where(eq(growthRecords.patientId, patientId))
    .orderBy(growthRecords.date);

  if (records.length === 0) {
    return {
      anomalies: [],
      zScores: [],
      projectedRecords: [],
      percentileData: [],
      combinedExplanation: null,
    };
  }

  const gender = patient.gender as "male" | "female";

  // ── 1. Z-scores + anomaly detection ───────────────────────────────────────
  const zScores = records.map((r) => {
    const zs = computeZScores(gender, r.ageInWeeks, r.weightKg, r.heightCm);
    return {
      date: r.date,
      ageInWeeks: r.ageInWeeks,
      weightKg: r.weightKg,
      heightCm: r.heightCm,
      weightForAgeZScore: zs.weightForAgeZScore,
      heightForAgeZScore: zs.heightForAgeZScore,
      weightStatus: zs.weightStatus,
      heightStatus: zs.heightStatus,
    };
  });

  const anomalies: GrowthAnomaly[] = [];
  for (let i = 0; i < zScores.length; i++) {
    const curr = zScores[i];
    if (curr.weightStatus === "risk") {
      anomalies.push({
        type: "weight_faltering",
        severity: "risk",
        message: `Weight-for-age Z-score is severely low (${curr.weightForAgeZScore?.toFixed(1)}) at ${curr.ageInWeeks} weeks.`,
        recordIndex: i,
      });
    } else if (curr.weightStatus === "warning") {
      anomalies.push({
        type: "weight_faltering",
        severity: "warning",
        message: `Weight-for-age Z-score is below normal (${curr.weightForAgeZScore?.toFixed(1)}) at ${curr.ageInWeeks} weeks.`,
        recordIndex: i,
      });
    }
    if (curr.heightStatus === "risk") {
      anomalies.push({
        type: "height_faltering",
        severity: "risk",
        message: `Height-for-age Z-score is severely low (${curr.heightForAgeZScore?.toFixed(1)}) at ${curr.ageInWeeks} weeks.`,
        recordIndex: i,
      });
    } else if (curr.heightStatus === "warning") {
      anomalies.push({
        type: "height_faltering",
        severity: "warning",
        message: `Height-for-age Z-score is below normal (${curr.heightForAgeZScore?.toFixed(1)}) at ${curr.ageInWeeks} weeks.`,
        recordIndex: i,
      });
    }
    if (i > 0) {
      const prev = zScores[i - 1];
      if (curr.weightForAgeZScore !== null && prev.weightForAgeZScore !== null) {
        const drop = prev.weightForAgeZScore - curr.weightForAgeZScore;
        if (drop > 1.5) {
          anomalies.push({
            type: "sudden_drop",
            severity: drop > 2.5 ? "risk" : "warning",
            message: `Sudden weight decline: Z-score dropped by ${drop.toFixed(1)} from ${prev.ageInWeeks}w to ${curr.ageInWeeks}w.`,
            recordIndex: i,
          });
        }
      }
      if (curr.heightForAgeZScore !== null && prev.heightForAgeZScore !== null) {
        const drop = prev.heightForAgeZScore - curr.heightForAgeZScore;
        if (drop > 1.5) {
          anomalies.push({
            type: "sudden_drop",
            severity: drop > 2.5 ? "risk" : "warning",
            message: `Sudden height decline: Z-score dropped by ${drop.toFixed(1)} from ${prev.ageInWeeks}w to ${curr.ageInWeeks}w.`,
            recordIndex: i,
          });
        }
      }
    }
  }

  // ── 2. Trajectory prediction + explanation (check cache first) ────────────
  let prediction: GrowthPrediction;
  let trajectoryCreatedAt: string | undefined;
  let combinedExplanation: string | null = null;

  const [cached] = await db
    .select()
    .from(growthPredictions)
    .where(eq(growthPredictions.patientId, patientId))
    .orderBy(desc(growthPredictions.createdAt))
    .limit(1);

  const hasValidCache =
    cached &&
    !force &&
    Date.now() - new Date(cached.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;

  if (hasValidCache) {
    prediction = {
      projectedRecords: JSON.parse(cached.projectedRecords),
      percentileData: JSON.parse(cached.percentileData),
      trajectoryExplanation: cached.trajectoryExplanation,
    };
    trajectoryCreatedAt = new Date(cached.createdAt).toISOString();
    combinedExplanation = cached.combinedExplanation;
  } else {
    // Generate new prediction
    if (records.length >= 2) {
      prediction = await _generateGrowthPrediction(patientId, role);
    } else {
      prediction = { projectedRecords: [], percentileData: [], trajectoryExplanation: null };
    }

    // Generate combined explanation via Gemini
    if (process.env.GEMINI_API_KEY) {
      const systemPrompt =
        role === "medical_professional"
          ? "You are a pediatric clinical assistant. Provide a concise combined assessment of the child's current growth status and projected trajectory. Mention any anomalies, their clinical significance, and whether the trajectory suggests improvement, stability, or concern. Be concise (3-4 sentences)."
          : "You are a friendly health educator. Explain the child's growth status and what the future trajectory looks like in simple, reassuring language. Highlight any positive trends or gentle warnings. Be concise (3-4 sentences).";

      const latest = records[records.length - 1];
      const latestZS = computeZScores(gender, latest.ageInWeeks, latest.weightKg, latest.heightCm);

      const userContent = `Patient: ${patient.name}, ${patient.gender}, ${latest.ageInWeeks} weeks old.

Growth measurements with WHO Z-scores:
${zScores
  .map(
    (z) =>
      `- ${z.date} (${z.ageInWeeks}w): Weight ${z.weightKg}kg (Z=${z.weightForAgeZScore?.toFixed(2) ?? "N/A"}), Height ${z.heightCm}cm (Z=${z.heightForAgeZScore?.toFixed(2) ?? "N/A"})`
  )
  .join("\n")}

Detected anomalies:
${anomalies.length > 0 ? anomalies.map((a) => `- ${a.severity.toUpperCase()}: ${a.message}`).join("\n") : "None"}

Latest measurement: Weight ${latest.weightKg}kg (Z=${latestZS.weightForAgeZScore?.toFixed(2) ?? "N/A"}), Height ${latest.heightCm}cm (Z=${latestZS.heightForAgeZScore?.toFixed(2) ?? "N/A"}).

Projected weight Z-scores over next 6 months: ${prediction.projectedRecords.map((p) => `${p.ageInWeeks}w: ${p.weightZScore}`).join(", ")}.
Projected height Z-scores over next 6 months: ${prediction.projectedRecords.map((p) => `${p.ageInWeeks}w: ${p.heightZScore}`).join(", ")}.

Please provide a brief combined summary of current status and future trajectory.`;

      combinedExplanation = await callGemini(systemPrompt, userContent);
    }

    // Store prediction + explanation in cache
    await db.insert(growthPredictions).values({
      patientId,
      projectedRecords: JSON.stringify(prediction.projectedRecords),
      percentileData: JSON.stringify(prediction.percentileData),
      trajectoryExplanation: prediction.trajectoryExplanation,
      combinedExplanation,
    });
    trajectoryCreatedAt = new Date().toISOString();
  }

  return {
    anomalies,
    zScores,
    projectedRecords: prediction.projectedRecords,
    percentileData: prediction.percentileData,
    combinedExplanation,
    trajectoryCreatedAt,
  };
}

// ─── AI: Visit Summary Generator ─────────────────────────────────────────────

export async function generateVisitSummary(appointmentId: string): Promise<string | null> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch appointment with patient info
  const [apt] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!apt) throw new Error("Appointment not found");
  if (apt.status !== "completed") throw new Error("Appointment must be completed");

  // Check if summary already exists
  const [existing] = await db
    .select()
    .from(visitSummaries)
    .where(eq(visitSummaries.appointmentId, appointmentId))
    .limit(1);

  if (existing) {
    return existing.summary;
  }

  const [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.id, apt.patientId))
    .limit(1);

  if (!patient) throw new Error("Patient not found");

  // Fetch logged appointment activities
  const activities = await db
    .select()
    .from(appointmentActivities)
    .where(eq(appointmentActivities.appointmentId, appointmentId))
    .orderBy(appointmentActivities.createdAt);

  // Build prompt from explicitly logged activities
  const systemPrompt =
    "You are a clinical documentation assistant. Generate a concise, professional visit summary for a pediatric appointment. Use clinical language. Structure the summary with: 1) Reason for Visit, 2) Assessment, 3) Plan. Base the summary ONLY on the activities explicitly logged by the clinician during this visit. Keep it to 3-5 sentences total.";

  const activitiesText = activities.length
    ? activities.map((a) => `- ${a.description}`).join("\n")
    : "No specific activities were logged for this visit.";

  const userContent = `Patient: ${patient.name}, ${patient.gender}, DOB ${patient.dateOfBirth}.
Appointment: ${apt.type} on ${apt.date}. Notes: ${apt.notes || "None"}.

Clinician-logged activities during this visit:
${activitiesText}

Generate a clinical visit summary based solely on the logged activities.`;

  const summary = await callGemini(systemPrompt, userContent);
  if (!summary) return null;

  await db.insert(visitSummaries).values({
    appointmentId,
    patientId: apt.patientId,
    doctorId: apt.doctorId,
    summary,
  });

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
  revalidatePath(`/patients/${apt.patientId}`);

  return summary;
}
