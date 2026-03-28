import { db } from "@/db";
import { patients, appointments, prescriptions, growthRecords, users, vaccinationRecords, vaccines } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ─── Doctor queries ──────────────────────────────────────────────────────────

export async function getDoctorStats(doctorId: string) {
  const [activePatients, todayAppointments, pendingPrescriptions] = await Promise.all([
    db
      .select({ count: sql<number>`count(distinct ${appointments.patientId})` })
      .from(appointments)
      .where(eq(appointments.doctorId, doctorId))
      .then((r) => Number(r[0]?.count ?? 0)),

    db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          eq(appointments.date, sql`current_date`),
          eq(appointments.status, "upcoming"),
        ),
      )
      .then((r) => Number(r[0]?.count ?? 0)),

    db
      .select({ count: sql<number>`count(*)` })
      .from(prescriptions)
      .where(and(eq(prescriptions.doctorId, doctorId), eq(prescriptions.status, "pending")))
      .then((r) => Number(r[0]?.count ?? 0)),
  ]);

  return { activePatients, todayAppointments, pendingPrescriptions };
}

export async function getDoctorAppointments(doctorId: string) {
  return db
    .select({
      id: appointments.id,
      patientId: appointments.patientId,
      date: appointments.date,
      time: appointments.time,
      type: appointments.type,
      status: appointments.status,
      notes: appointments.notes,
      patientName: patients.name,
      patientDob: patients.dateOfBirth,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(eq(appointments.doctorId, doctorId))
    .orderBy(desc(appointments.date));
}

export async function getDoctorPatients(doctorId: string) {
  return db
    .selectDistinct({
      id: patients.id,
      name: patients.name,
      dateOfBirth: patients.dateOfBirth,
      gender: patients.gender,
      bloodType: patients.bloodType,
    })
    .from(patients)
    .innerJoin(appointments, eq(appointments.patientId, patients.id))
    .where(eq(appointments.doctorId, doctorId));
}

export async function getDoctorPrescriptions(doctorId: string) {
  return db
    .select({
      id: prescriptions.id,
      patientId: prescriptions.patientId,
      medication: prescriptions.medication,
      dosage: prescriptions.dosage,
      status: prescriptions.status,
      startDate: prescriptions.startDate,
      endDate: prescriptions.endDate,
      notes: prescriptions.notes,
      patientName: patients.name,
    })
    .from(prescriptions)
    .innerJoin(patients, eq(prescriptions.patientId, patients.id))
    .where(eq(prescriptions.doctorId, doctorId))
    .orderBy(desc(prescriptions.startDate));
}

// ─── Parent queries ───────────────────────────────────────────────────────────

export async function getParentChildren(parentId: string) {
  return db
    .select()
    .from(patients)
    .where(eq(patients.parentId, parentId))
    .orderBy(patients.name);
}

export async function getChildAppointments(childId: string) {
  return db
    .select({
      id: appointments.id,
      date: appointments.date,
      time: appointments.time,
      type: appointments.type,
      status: appointments.status,
      notes: appointments.notes,
      doctorName: users.name,
    })
    .from(appointments)
    .innerJoin(users, eq(appointments.doctorId, users.id))
    .where(eq(appointments.patientId, childId))
    .orderBy(desc(appointments.date));
}

export async function getChildPrescriptions(childId: string) {
  return db
    .select({
      id: prescriptions.id,
      medication: prescriptions.medication,
      dosage: prescriptions.dosage,
      status: prescriptions.status,
      startDate: prescriptions.startDate,
      endDate: prescriptions.endDate,
      doctorName: users.name,
    })
    .from(prescriptions)
    .innerJoin(users, eq(prescriptions.doctorId, users.id))
    .where(eq(prescriptions.patientId, childId))
    .orderBy(desc(prescriptions.startDate));
}

export async function getChildGrowthRecords(childId: string) {
  return db
    .select({
      id: growthRecords.id,
      date: growthRecords.date,
      weightKg: growthRecords.weightKg,
      heightCm: growthRecords.heightCm,
      ageInWeeks: growthRecords.ageInWeeks,
    })
    .from(growthRecords)
    .where(eq(growthRecords.patientId, childId))
    .orderBy(growthRecords.date);
}

export async function getChildVaccinations(childId: string) {
  return db
    .select({
      id: vaccinationRecords.id,
      status: vaccinationRecords.status,
      dueDate: vaccinationRecords.dueDate,
      administeredDate: vaccinationRecords.administeredDate,
      batchNumber: vaccinationRecords.batchNumber,
      clinic: vaccinationRecords.clinic,
      vaccineName: vaccines.name,
      vaccineDescription: vaccines.description,
      recommendedAgeWeeks: vaccines.recommendedAgeWeeks,
    })
    .from(vaccinationRecords)
    .innerJoin(vaccines, eq(vaccinationRecords.vaccineId, vaccines.id))
    .where(eq(vaccinationRecords.patientId, childId))
    .orderBy(vaccines.recommendedAgeWeeks);
}

// Also fetch all vaccines so we can show which ones haven't been scheduled yet
export async function getAllVaccines() {
  return db
    .select()
    .from(vaccines)
    .orderBy(vaccines.recommendedAgeWeeks);
}

// ─── Reference data for modals ───────────────────────────────────────────────

export async function getAllPatients() {
  return db
    .select({
      id: patients.id,
      name: patients.name,
      dateOfBirth: patients.dateOfBirth,
      gender: patients.gender,
      bloodType: patients.bloodType,
    })
    .from(patients)
    .orderBy(patients.name);
}

export async function getAllParents() {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.role, "parent"))
    .orderBy(users.name);
}

export async function getAllDoctors() {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.role, "medical_professional"))
    .orderBy(users.name);
}

// ─── Single-record queries for editing ───────────────────────────────────────

export async function getPatientById(id: string) {
  const rows = await db
    .select({
      id: patients.id,
      name: patients.name,
      dateOfBirth: patients.dateOfBirth,
      gender: patients.gender,
      bloodType: patients.bloodType,
      parentId: patients.parentId,
      parentName: users.name,
    })
    .from(patients)
    .leftJoin(users, eq(patients.parentId, users.id))
    .where(eq(patients.id, id));
  return rows[0] ?? null;
}

export async function getAppointmentById(id: string) {
  const rows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, id));
  return rows[0] ?? null;
}

export async function getPrescriptionById(id: string) {
  const rows = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.id, id));
  return rows[0] ?? null;
}

export async function getGrowthRecordById(id: string) {
  const rows = await db
    .select()
    .from(growthRecords)
    .where(eq(growthRecords.id, id));
  return rows[0] ?? null;
}
