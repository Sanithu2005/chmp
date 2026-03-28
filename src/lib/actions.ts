"use server";

import { db } from "@/db";
import {
  patients,
  appointments,
  prescriptions,
  growthRecords,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// ─── Patients ────────────────────────────────────────────────────────────────

export async function createPatient(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const gender = formData.get("gender") as "male" | "female";
  const bloodType = (formData.get("bloodType") as string) || "Unknown";
  const parentId = formData.get("parentId") as string;

  if (!name || !dateOfBirth || !gender) {
    throw new Error("Missing required fields");
  }

  const finalParentId =
    session.user.role === "parent" ? session.user.id : parentId;

  if (!finalParentId) {
    throw new Error("Parent is required");
  }

  await db.insert(patients).values({
    name,
    dateOfBirth,
    gender,
    bloodType: bloodType as "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "Unknown",
    parentId: finalParentId,
  });

  revalidatePath("/doctor");
  revalidatePath("/parent");
}

// ─── Appointments ────────────────────────────────────────────────────────────

export async function createAppointment(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const patientId = formData.get("patientId") as string;
  const doctorId = formData.get("doctorId") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const type = formData.get("type") as "Routine" | "Vaccination" | "Follow-up";
  const notes = (formData.get("notes") as string) || null;

  if (!patientId || !doctorId || !date || !time || !type) {
    throw new Error("Missing required fields");
  }

  await db.insert(appointments).values({
    patientId,
    doctorId,
    date,
    time,
    type,
    status: "upcoming",
    notes,
  });

  revalidatePath("/doctor");
  revalidatePath("/parent");
}

export async function updateAppointmentStatus(
  id: string,
  status: "upcoming" | "completed" | "cancelled"
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  await db
    .update(appointments)
    .set({ status })
    .where(eq(appointments.id, id));

  revalidatePath("/doctor");
  revalidatePath("/parent");
}

// ─── Prescriptions ───────────────────────────────────────────────────────────

export async function createPrescription(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "medical_professional") {
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
    doctorId: session.user.id,
    medication,
    dosage,
    startDate,
    endDate,
    status: "active",
    notes,
  });

  revalidatePath("/doctor");
  revalidatePath("/parent");
}

export async function updatePrescriptionStatus(
  id: string,
  status: "active" | "pending" | "completed" | "cancelled"
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "medical_professional") {
    throw new Error("Unauthorized");
  }

  await db
    .update(prescriptions)
    .set({ status })
    .where(eq(prescriptions.id, id));

  revalidatePath("/doctor");
  revalidatePath("/parent");
}

// ─── Growth Records ──────────────────────────────────────────────────────────

export async function createGrowthRecord(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "medical_professional") {
    throw new Error("Unauthorized");
  }

  const patientId = formData.get("patientId") as string;
  const date = formData.get("date") as string;
  const weightKg = parseFloat(formData.get("weightKg") as string);
  const heightCm = parseFloat(formData.get("heightCm") as string);
  const ageInWeeks = parseInt(formData.get("ageInWeeks") as string, 10);

  if (
    !patientId ||
    !date ||
    Number.isNaN(weightKg) ||
    Number.isNaN(heightCm) ||
    Number.isNaN(ageInWeeks)
  ) {
    throw new Error("Missing or invalid fields");
  }

  await db.insert(growthRecords).values({
    patientId,
    date,
    weightKg,
    heightCm,
    ageInWeeks,
    recordedById: session.user.id,
  });

  revalidatePath("/doctor");
  revalidatePath("/parent");
}

export async function updatePatient(id: string, formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const gender = formData.get("gender") as "male" | "female";
  const bloodType = (formData.get("bloodType") as string) || "Unknown";

  if (!name || !dateOfBirth || !gender) {
    throw new Error("Missing required fields");
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

  revalidatePath("/doctor");
  revalidatePath("/parent");
  revalidatePath(`/patients/${id}`);
}

export async function deletePatient(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  await db.delete(patients).where(eq(patients.id, id));

  revalidatePath("/doctor");
  revalidatePath("/parent");
}

// ─── Appointments Edit/Delete ────────────────────────────────────────────────

export async function updateAppointment(id: string, formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

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

  revalidatePath("/doctor");
  revalidatePath("/parent");
}

export async function deleteAppointment(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  await db.delete(appointments).where(eq(appointments.id, id));

  revalidatePath("/doctor");
  revalidatePath("/parent");
}

// ─── Prescriptions Edit/Delete ───────────────────────────────────────────────

export async function updatePrescription(id: string, formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "medical_professional") {
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

  revalidatePath("/doctor");
  revalidatePath("/parent");
}

export async function deletePrescription(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "medical_professional") {
    throw new Error("Unauthorized");
  }

  await db.delete(prescriptions).where(eq(prescriptions.id, id));

  revalidatePath("/doctor");
  revalidatePath("/parent");
}

// ─── Growth Records Edit/Delete ──────────────────────────────────────────────

export async function updateGrowthRecord(id: string, formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "medical_professional") {
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

  revalidatePath("/doctor");
  revalidatePath("/parent");
}

export async function deleteGrowthRecord(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "medical_professional") {
    throw new Error("Unauthorized");
  }

  await db.delete(growthRecords).where(eq(growthRecords.id, id));

  revalidatePath("/doctor");
  revalidatePath("/parent");
}
