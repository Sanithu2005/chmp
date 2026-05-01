import { pgTable, text, timestamp, date, integer, uuid, boolean, pgEnum, doublePrecision } from "drizzle-orm/pg-core";

// --- Enums ---
export const userRoleEnum = pgEnum("user_role", ["parent", "medical_professional"]);
export const medicalRoleEnum = pgEnum("medical_role", ["pediatrician", "midwife"]);
export const genderEnum = pgEnum("gender", ["male", "female"]);
export const bloodTypeEnum = pgEnum("blood_type", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"]);
export const appointmentTypeEnum = pgEnum("appointment_type", ["Routine", "Vaccination", "Follow-up"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["pending", "upcoming", "completed", "cancelled"]);
export const prescriptionStatusEnum = pgEnum("prescription_status", ["active", "pending", "completed", "cancelled"]);
export const appointmentActivityTypeEnum = pgEnum("appointment_activity_type", ["vaccine_administered", "prescription_started", "prescription_continued", "prescription_stopped", "growth_measured", "general_note", "custom"]);


// --- Tables ---

export const users = pgTable("users", {
  id: text("id").primaryKey(), // better-auth uses text for ids by default
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  role: userRoleEnum("role").notNull(),
  medicalRole: medicalRoleEnum("medical_role"), // Only for medical professionals
  licenseNumber: text("license_number"), // Only for medical professionals
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(()=> users.id, { onDelete: "cascade" })
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(()=> users.id, { onDelete: "cascade" }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});

export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: genderEnum("gender").notNull(),
  bloodType: bloodTypeEnum("blood_type").default("Unknown"),
  image: text("image"),
  registrationDate: timestamp("registration_date").notNull().defaultNow(),
});

// Many-to-many: parents <-> patients
export const parentPatients = pgTable("parent_patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: text("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vaccinationRecords = pgTable("vaccination_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  vaccineName: text("vaccine_name").notNull(),
  administeredById: text("administered_by_id").references(() => users.id),
  dueDate: date("due_date").notNull(),
  administeredDate: date("administered_date"),
  batchNumber: text("batch_number"),
  clinic: text("clinic"),
});

export const growthRecords = pgTable("growth_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  weightKg: doublePrecision("weight_kg").notNull(),
  heightCm: doublePrecision("height_cm").notNull(),
  ageInWeeks: integer("age_in_weeks").notNull(),
  weightForAgeZScore: doublePrecision("weight_for_age_z_score"),
  heightForAgeZScore: doublePrecision("height_for_age_z_score"),
  recordedById: text("recorded_by_id").notNull().references(() => users.id),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  doctorId: text("doctor_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  time: text("time").notNull(), // e.g. "10:00 AM"
  type: appointmentTypeEnum("type").notNull(),
  status: appointmentStatusEnum("status").notNull().default("pending"),
  confirmedById: text("confirmed_by_id").references(() => users.id),
  notes: text("notes"),
});

export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  doctorId: text("doctor_id").notNull().references(() => users.id),
  medication: text("medication").notNull(),
  dosage: text("dosage").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: prescriptionStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
});

export const visitSummaries = pgTable("visit_summaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  appointmentId: uuid("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  doctorId: text("doctor_id").notNull().references(() => users.id),
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const appointmentActivities = pgTable("appointment_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  appointmentId: uuid("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
  type: appointmentActivityTypeEnum("type").notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON string for optional structured data
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const growthPredictions = pgTable("growth_predictions", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  projectedRecords: text("projected_records").notNull(), // JSON array
  percentileData: text("percentile_data").notNull(), // JSON array
  trajectoryExplanation: text("trajectory_explanation"),
  combinedExplanation: text("combined_explanation"), // cached AI growth analysis explanation
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Pediatrician availability: recurring weekly schedule
export const doctorAvailability = pgTable("doctor_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  doctorId: text("doctor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startTime: text("start_time").notNull(), // "HH:MM" 24-hour format
  endTime: text("end_time").notNull(), // "HH:MM" 24-hour format
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
