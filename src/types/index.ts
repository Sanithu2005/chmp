// ─── User & Auth ──────────────────────────────────────────────────────────────

export type UserRole = "parent" | "medical_professional";
export type MedicalRole = "pediatrician" | "midwife";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  medicalRole?: MedicalRole;
  createdAt: Date;
}

// ─── Parent-Patient Junction ─────────────────────────────────────────────────

export interface ParentPatient {
  id: string;
  parentId: string;
  patientId: string;
  createdAt: Date;
}

// ─── Patient ──────────────────────────────────────────────────────────────────

export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "Unknown";
export type Gender = "male" | "female";

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: Date;
  gender: Gender;
  bloodType: BloodType;
  image?: string | null;
  registrationDate: Date;
}

// ─── Doctor Availability ─────────────────────────────────────────────────────

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  createdAt: Date;
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export type AppointmentType = "Routine" | "Vaccination" | "Follow-up";
export type AppointmentStatus = "pending" | "upcoming" | "completed" | "cancelled";

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

export interface VaccinationRecord {
  id: string;
  patientId: string;
  vaccineName: string;
  administeredById?: string;
  dueDate: Date;
  administeredDate?: Date;
  batchNumber?: string;
  clinic?: string;
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
