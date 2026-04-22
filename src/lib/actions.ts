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
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

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

  revalidatePath("/medical-professional");
  revalidatePath("/parent");
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
    .select({ dateOfBirth: patients.dateOfBirth })
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

  await db.insert(growthRecords).values({
    patientId,
    date,
    weightKg,
    heightCm,
    ageInWeeks,
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

  await db
    .update(growthRecords)
    .set({ date, weightKg, heightCm, ageInWeeks })
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
