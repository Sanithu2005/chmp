// ─── User & Auth ──────────────────────────────────────────────────────────────

export type UserRole = "parent" | "medical_professional";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

// ─── Patient ──────────────────────────────────────────────────────────────────

export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "Unknown";
export type Gender = "male" | "female";

export interface Patient {
  id: string;
  parentId: string;
  name: string;
  dateOfBirth: Date;
  gender: Gender;
  bloodType: BloodType;
  registrationDate: Date;
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export type AppointmentType = "Routine" | "Vaccination" | "Follow-up";
export type AppointmentStatus = "upcoming" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  date: Date;
  time: string;
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
}

// ─── Prescriptions ────────────────────────────────────────────────────────────

export type PrescriptionStatus = "active" | "pending" | "completed" | "cancelled";

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  medication: string;
  dosage: string;
  startDate: Date;
  endDate?: Date;
  status: PrescriptionStatus;
  notes?: string;
}

// ─── Vaccinations ─────────────────────────────────────────────────────────────

export type VaccinationStatus = "upcoming" | "due_this_week" | "overdue" | "administered";

export interface Vaccine {
  id: string;
  name: string;
  recommendedAgeWeeks: number;
  description?: string;
}

export interface VaccinationRecord {
  id: string;
  patientId: string;
  vaccineId: string;
  vaccineName: string;
  administeredBy: string;
  date: Date;
  batchNumber?: string;
  clinic?: string;
  status: VaccinationStatus;
  dueDate: Date;
}

// ─── Growth Records ───────────────────────────────────────────────────────────

export interface GrowthRecord {
  id: string;
  patientId: string;
  date: Date;
  weightKg: number;
  heightCm: number;
  ageInWeeks: number;
  weightForAgeZScore?: number;
  heightForAgeZScore?: number;
}

// ─── Health Metrics ───────────────────────────────────────────────────────────

export interface HealthMetric {
  id: string;
  type: string;
  value: string;
  unit?: string;
  timestamp: string;
  status: "normal" | "warning" | "critical";
}

// ─── WHO LMS ──────────────────────────────────────────────────────────────────

export interface LMSEntry {
  ageWeeks: number;
  L: number; // Box-Cox power
  M: number; // Median
  S: number; // Coefficient of variation
}

export interface LMSTable {
  male: LMSEntry[];
  female: LMSEntry[];
}
