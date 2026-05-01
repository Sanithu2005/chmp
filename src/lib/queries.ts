import { db } from "@/db";
import {
  patients,
  appointments,
  prescriptions,
  growthRecords,
  users,
  vaccinationRecords,
  parentPatients,
  doctorAvailability,
  visitSummaries,
} from "@/db/schema";
import { eq, and, or, desc, sql, ilike } from "drizzle-orm";

// ─── Medical Professional queries ────────────────────────────────────────────

export async function getMidwifeStats(medicalId: string) {
  const [prescriptionIds, growthIds, vaccineIds] = await Promise.all([
    db
      .selectDistinct({ patientId: prescriptions.patientId })
      .from(prescriptions)
      .where(eq(prescriptions.doctorId, medicalId)),
    db
      .selectDistinct({ patientId: growthRecords.patientId })
      .from(growthRecords)
      .where(eq(growthRecords.recordedById, medicalId)),
    db
      .selectDistinct({ patientId: vaccinationRecords.patientId })
      .from(vaccinationRecords)
      .where(eq(vaccinationRecords.administeredById, medicalId)),
  ]);

  const ids = new Set([
    ...prescriptionIds.map((r) => r.patientId),
    ...growthIds.map((r) => r.patientId),
    ...vaccineIds.map((r) => r.patientId),
  ]);

  return { activePatients: ids.size };
}


export async function getDoctorStats(doctorId: string) {
  const [activePatients, todayAppointments, pendingConfirmations] =
    await Promise.all([
      db
        .select({
          count: sql<number>`count(distinct ${appointments.patientId})`,
        })
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
        .from(appointments)
        .where(
          and(
            eq(appointments.doctorId, doctorId),
            eq(appointments.status, "pending"),
          ),
        )
        .then((r) => Number(r[0]?.count ?? 0)),
    ]);

  return { activePatients, todayAppointments, pendingConfirmations };
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

export async function getDoctorPendingAppointments(doctorId: string) {
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
    .where(
      and(eq(appointments.doctorId, doctorId), eq(appointments.status, "pending")),
    )
    .orderBy(appointments.date, appointments.time);
}

export async function getDoctorPatients(doctorId: string, medicalRole: "pediatrician" | "midwife") {
  if (medicalRole === "pediatrician") {
    return db
      .selectDistinct({
        id: patients.id,
        name: patients.name,
        dateOfBirth: patients.dateOfBirth,
        gender: patients.gender,
        bloodType: patients.bloodType,
        image: patients.image,
      })
      .from(patients)
      .innerJoin(appointments, eq(appointments.patientId, patients.id))
      .where(eq(appointments.doctorId, doctorId));
  }

  // Midwife: patients they've added prescriptions, growth records, or vaccinations for
  const cols = { id: patients.id, name: patients.name, dateOfBirth: patients.dateOfBirth, gender: patients.gender, bloodType: patients.bloodType, image: patients.image };
  const [prescriptionPatients, growthPatients, vaccinePatients] = await Promise.all([
    db.selectDistinct(cols).from(patients).innerJoin(prescriptions, eq(prescriptions.patientId, patients.id)).where(eq(prescriptions.doctorId, doctorId)),
    db.selectDistinct(cols).from(patients).innerJoin(growthRecords, eq(growthRecords.patientId, patients.id)).where(eq(growthRecords.recordedById, doctorId)),
    db.selectDistinct(cols).from(patients).innerJoin(vaccinationRecords, eq(vaccinationRecords.patientId, patients.id)).where(eq(vaccinationRecords.administeredById, doctorId)),
  ]);

  const map = new Map<string, typeof prescriptionPatients[0]>();
  [...prescriptionPatients, ...growthPatients, ...vaccinePatients].forEach((p) => {
    if (!map.has(p.id)) map.set(p.id, p);
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
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

export async function getDoctorAvailability(doctorId: string) {
  return db
    .select()
    .from(doctorAvailability)
    .where(eq(doctorAvailability.doctorId, doctorId))
    .orderBy(doctorAvailability.dayOfWeek, doctorAvailability.startTime);
}

// Compute free time slots for a pediatrician on a given date
export async function getAvailableSlots(doctorId: string, dateStr: string) {
  const dateObj = new Date(dateStr);
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ...

  // Get the doctor's availability for this day
  const availability = await db
    .select()
    .from(doctorAvailability)
    .where(
      and(
        eq(doctorAvailability.doctorId, doctorId),
        eq(doctorAvailability.dayOfWeek, dayOfWeek),
      ),
    );

  if (availability.length === 0) return [];

  // Get existing appointments for this doctor on this date (pending + upcoming + completed)
  const booked = await db
    .select({ time: appointments.time })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.date, dateStr),
        sql`${appointments.status} in ('pending', 'upcoming', 'completed')`,
      ),
    );

  const bookedTimes = new Set(booked.map((b) => b.time));

  // Generate 30-minute slots from availability blocks
  const allSlots: string[] = [];
  for (const block of availability) {
    let current = parseTime(block.startTime);
    const end = parseTime(block.endTime);
    while (current < end) {
      const slotStr = formatTime(current);
      if (!bookedTimes.has(slotStr)) {
        allSlots.push(slotStr);
      }
      current = addMinutes(current, 30);
    }
  }

  return allSlots;
}

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
}
function addMinutes(minutes: number, m: number): number {
  return minutes + m;
}

// ─── Parent queries ───────────────────────────────────────────────────────────

export async function getParentChildren(parentId: string) {
  return db
    .select({
      id: patients.id,
      name: patients.name,
      dateOfBirth: patients.dateOfBirth,
      gender: patients.gender,
      bloodType: patients.bloodType,
      image: patients.image,
    })
    .from(patients)
    .innerJoin(parentPatients, eq(parentPatients.patientId, patients.id))
    .where(eq(parentPatients.parentId, parentId))
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
      weightForAgeZScore: growthRecords.weightForAgeZScore,
      heightForAgeZScore: growthRecords.heightForAgeZScore,
    })
    .from(growthRecords)
    .where(eq(growthRecords.patientId, childId))
    .orderBy(growthRecords.date);
}

export async function getVisitSummaryForAppointment(appointmentId: string) {
  const rows = await db
    .select()
    .from(visitSummaries)
    .where(eq(visitSummaries.appointmentId, appointmentId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getVisitSummariesForPatient(patientId: string) {
  return db
    .select({
      id: visitSummaries.id,
      appointmentId: visitSummaries.appointmentId,
      summary: visitSummaries.summary,
      createdAt: visitSummaries.createdAt,
      doctorName: users.name,
    })
    .from(visitSummaries)
    .innerJoin(users, eq(visitSummaries.doctorId, users.id))
    .where(eq(visitSummaries.patientId, patientId))
    .orderBy(desc(visitSummaries.createdAt));
}

export async function getChildVaccinations(childId: string) {
  return db
    .select({
      id: vaccinationRecords.id,
      dueDate: vaccinationRecords.dueDate,
      administeredDate: vaccinationRecords.administeredDate,
      batchNumber: vaccinationRecords.batchNumber,
      clinic: vaccinationRecords.clinic,
      vaccineName: vaccinationRecords.vaccineName,
    })
    .from(vaccinationRecords)
    .where(eq(vaccinationRecords.patientId, childId))
    .orderBy(vaccinationRecords.dueDate);
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
      image: patients.image,
    })
    .from(patients)
    .orderBy(patients.name);
}

export async function searchPatients(query: string) {
  const q = `%${query}%`;
  return db
    .select({
      id: patients.id,
      name: patients.name,
      dateOfBirth: patients.dateOfBirth,
      gender: patients.gender,
      bloodType: patients.bloodType,
      image: patients.image,
    })
    .from(patients)
    .where(
      or(
        ilike(patients.name, q),
        ilike(patients.bloodType, q)
      )
    )
    .orderBy(patients.name)
    .limit(10);
}

export async function getAllParents() {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.role, "parent"))
    .orderBy(users.name);
}

export async function getAllMedicalProfessionals() {
  return db
    .select({ id: users.id, name: users.name, email: users.email, medicalRole: users.medicalRole })
    .from(users)
    .where(eq(users.role, "medical_professional"))
    .orderBy(users.name);
}

export async function getAllPediatricians() {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(
      and(
        eq(users.role, "medical_professional"),
        eq(users.medicalRole, "pediatrician"),
      ),
    )
    .orderBy(users.name);
}

export async function searchPediatricians(query: string) {
  const q = `%${query}%`;
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(
      and(
        eq(users.role, "medical_professional"),
        eq(users.medicalRole, "pediatrician"),
        ilike(users.name, q),
      ),
    )
    .orderBy(users.name)
    .limit(10);
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
      image: patients.image,
    })
    .from(patients)
    .where(eq(patients.id, id));
  return rows[0] ?? null;
}

export async function getPatientParents(patientId: string) {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .innerJoin(parentPatients, eq(parentPatients.parentId, users.id))
    .where(eq(parentPatients.patientId, patientId));
}

export async function getAppointmentById(id: string) {
  const rows = await db.select().from(appointments).where(eq(appointments.id, id));
  return rows[0] ?? null;
}

export async function getPrescriptionById(id: string) {
  const rows = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
  return rows[0] ?? null;
}

export async function getGrowthRecordById(id: string) {
  const rows = await db.select().from(growthRecords).where(eq(growthRecords.id, id));
  return rows[0] ?? null;
}

// ─── Role / permission helpers ─────────────────────────────────────────────────

export async function getUserById(id: string) {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      medicalRole: users.medicalRole,
    })
    .from(users)
    .where(eq(users.id, id));
  return rows[0] ?? null;
}

export async function isParentOfPatient(parentId: string, patientId: string) {
  const rows = await db
    .select()
    .from(parentPatients)
    .where(
      and(
        eq(parentPatients.parentId, parentId),
        eq(parentPatients.patientId, patientId),
      ),
    );
  return rows.length > 0;
}
