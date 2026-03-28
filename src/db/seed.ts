import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import * as dotenv from "dotenv";
import { auth } from "../lib/auth";

dotenv.config({ path: ".env" });

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://chmp:chmp_dev_password@localhost:5432/chmp_db",
});

const db = drizzle(pool, { schema });

const PASSWORD = "chmp_dev_password"; // shared test password

async function seed() {
  console.log("🌱 Starting seeding...");

  // ── 1. Clear existing data (order matters due to FKs) ──────────────────────
  console.log("🧹 Clearing existing data...");
  await db.delete(schema.prescriptions);
  await db.delete(schema.appointments);
  await db.delete(schema.growthRecords);
  await db.delete(schema.vaccinationRecords);
  await db.delete(schema.vaccines);
  await db.delete(schema.patients);
  // Clear better-auth tables before users
  await db.delete(schema.verifications);
  await db.delete(schema.sessions);
  await db.delete(schema.accounts);
  await db.delete(schema.users);

  // ── 2. Create Users via better-auth (creates proper password hashes) ────────
  console.log("👤 Seeding Users via better-auth...");

  type SignUpBody = { name: string; email: string; password: string; role?: string; licenseNumber?: string };

  const signUp = async (body: SignUpBody): Promise<{ user: { id: string } }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await auth.api.signUpEmail({ body } as any);
    // When asResponse is not set, better-auth may return the parsed object or a Response
    if (res instanceof Response) return res.json();
    return res as { user: { id: string } };
  };

  const doctorResult = await signUp({
    name: "Dr. Nirmala Perera",
    email: "nirmala@chmp.test",
    password: PASSWORD,
    role: "medical_professional",
    licenseNumber: "SLMC-12345",
  });

  const parent1Result = await signUp({
    name: "Chamari Silva",
    email: "chamari@parent.test",
    password: PASSWORD,
    role: "parent",
  });

  const parent2Result = await signUp({
    name: "Dinesh Fernando",
    email: "dinesh@parent.test",
    password: PASSWORD,
    role: "parent",
  });

  const doctorId = doctorResult.user.id;
  const parent1Id = parent1Result.user.id;
  const parent2Id = parent2Result.user.id;

  console.log(`  ✓ Doctor: ${doctorId}`);
  console.log(`  ✓ Parent 1: ${parent1Id}`);
  console.log(`  ✓ Parent 2: ${parent2Id}`);

  // ── 3. Insert Patients ────────────────────────────────────────────────────
  console.log("👶 Seeding Patients...");
  const patientsData = await db
    .insert(schema.patients)
    .values([
      {
        parentId: parent1Id,
        name: "Sanuli Silva",
        dateOfBirth: "2023-08-15",
        gender: "female",
        bloodType: "A+",
      },
      {
        parentId: parent2Id,
        name: "Thehan Fernando",
        dateOfBirth: "2023-11-20",
        gender: "male",
        bloodType: "O+",
      },
    ])
    .returning();

  const sanuli = patientsData[0];
  const thehan = patientsData[1];

  // ── 4. Insert Vaccines (Sri Lanka National Immunization Schedule) ─────────
  console.log("💉 Seeding Vaccines...");
  const vaccinesData = await db
    .insert(schema.vaccines)
    .values([
      { name: "BCG", recommendedAgeWeeks: 0, description: "At birth" },
      { name: "OPV 1", recommendedAgeWeeks: 8, description: "2 months" },
      { name: "Pentavalent 1", recommendedAgeWeeks: 8, description: "2 months" },
      { name: "OPV 2", recommendedAgeWeeks: 16, description: "4 months" },
      { name: "Pentavalent 2", recommendedAgeWeeks: 16, description: "4 months" },
      { name: "OPV 3", recommendedAgeWeeks: 24, description: "6 months" },
      { name: "Pentavalent 3", recommendedAgeWeeks: 24, description: "6 months" },
      { name: "MMR 1", recommendedAgeWeeks: 36, description: "9 months" },
      { name: "Japanese Encephalitis", recommendedAgeWeeks: 52, description: "1 year" },
    ])
    .returning();

  const [bcg, opv1, penta1, opv2, penta2, opv3, penta3, mmr1, je] = vaccinesData;

  // ── 5. Insert Vaccination Records for Sanuli ────────────────────────────────
  // Sanuli born 2023-08-15. By Feb 2024 she is ~26 weeks.
  // Administered: BCG, OPV1, Penta1, OPV2, Penta2 (all done by 4 months)
  // Due this week: OPV3, Penta3 (6 months = ~week 26)
  // Upcoming: MMR1, JE
  console.log("💉 Seeding Vaccination Records for Sanuli...");
  await db.insert(schema.vaccinationRecords).values([
    {
      patientId: sanuli.id,
      vaccineId: bcg.id,
      administeredById: doctorId,
      dueDate: "2023-08-15",
      administeredDate: "2023-08-15",
      batchNumber: "BCG-2023-001",
      clinic: "Lady Ridgeway Hospital for Children",
      status: "administered",
    },
    {
      patientId: sanuli.id,
      vaccineId: opv1.id,
      administeredById: doctorId,
      dueDate: "2023-10-10",
      administeredDate: "2023-10-12",
      batchNumber: "OPV-2023-A42",
      clinic: "Lady Ridgeway Hospital for Children",
      status: "administered",
    },
    {
      patientId: sanuli.id,
      vaccineId: penta1.id,
      administeredById: doctorId,
      dueDate: "2023-10-10",
      administeredDate: "2023-10-12",
      batchNumber: "PENTA-2023-B17",
      clinic: "Lady Ridgeway Hospital for Children",
      status: "administered",
    },
    {
      patientId: sanuli.id,
      vaccineId: opv2.id,
      administeredById: doctorId,
      dueDate: "2023-12-05",
      administeredDate: "2023-12-06",
      batchNumber: "OPV-2023-A89",
      clinic: "Lady Ridgeway Hospital for Children",
      status: "administered",
    },
    {
      patientId: sanuli.id,
      vaccineId: penta2.id,
      administeredById: doctorId,
      dueDate: "2023-12-05",
      administeredDate: "2023-12-06",
      batchNumber: "PENTA-2023-B55",
      clinic: "Lady Ridgeway Hospital for Children",
      status: "administered",
    },
    {
      patientId: sanuli.id,
      vaccineId: opv3.id,
      dueDate: "2024-02-06",
      status: "due_this_week",
    },
    {
      patientId: sanuli.id,
      vaccineId: penta3.id,
      dueDate: "2024-02-06",
      status: "due_this_week",
    },
    {
      patientId: sanuli.id,
      vaccineId: mmr1.id,
      dueDate: "2024-05-07",
      status: "upcoming",
    },
    {
      patientId: sanuli.id,
      vaccineId: je.id,
      dueDate: "2024-08-14",
      status: "upcoming",
    },
  ]);

  // ── 6. Insert Appointments ───────────────────────────────────────────────
  console.log("📅 Seeding Appointments...");
  await db.insert(schema.appointments).values([
    {
      patientId: sanuli.id,
      doctorId,
      date: "2024-02-28",
      time: "10:00 AM",
      type: "Routine",
      status: "upcoming",
      notes: "6 months routine checkup",
    },
    {
      patientId: thehan.id,
      doctorId,
      date: "2024-03-05",
      time: "11:00 AM",
      type: "Vaccination",
      status: "upcoming",
      notes: "Scheduled for Pentavalent 2 and OPV 2",
    },
    {
      patientId: sanuli.id,
      doctorId,
      date: "2024-01-15",
      time: "09:30 AM",
      type: "Routine",
      status: "completed",
      notes: "Healthy progress",
    },
  ]);

  // ── 7. Insert Prescriptions ───────────────────────────────────────────────
  console.log("💊 Seeding Prescriptions...");
  await db.insert(schema.prescriptions).values([
    {
      patientId: sanuli.id,
      doctorId,
      medication: "Vitamin D Drops",
      dosage: "1 drop daily",
      startDate: "2023-09-01",
      status: "active",
      notes: "Continue until 1 year",
    },
    {
      patientId: thehan.id,
      doctorId,
      medication: "Iron Supplement",
      dosage: "As directed by pediatrician",
      startDate: "2024-02-01",
      status: "active",
    },
  ]);

  // ── 8. Insert Growth Records ───────────────────────────────────────────────
  console.log("📏 Seeding Growth Records...");
  await db.insert(schema.growthRecords).values([
    { patientId: sanuli.id, date: "2023-08-15", weightKg: 3.2, heightCm: 50, ageInWeeks: 0, recordedById: doctorId },
    { patientId: sanuli.id, date: "2023-10-12", weightKg: 5.1, heightCm: 57, ageInWeeks: 8, recordedById: doctorId },
    { patientId: sanuli.id, date: "2023-12-06", weightKg: 6.3, heightCm: 62, ageInWeeks: 16, recordedById: doctorId },
    { patientId: sanuli.id, date: "2024-01-15", weightKg: 6.8, heightCm: 64, ageInWeeks: 21, recordedById: doctorId },
    { patientId: thehan.id, date: "2023-11-20", weightKg: 3.5, heightCm: 51, ageInWeeks: 0, recordedById: doctorId },
    { patientId: thehan.id, date: "2024-01-20", weightKg: 5.5, heightCm: 58, ageInWeeks: 8, recordedById: doctorId },
  ]);

  console.log("\n✅ Seeding complete!");
  console.log("─────────────────────────────────────────");
  console.log("  Test accounts (password: chmp_dev_password)");
  console.log("  👨‍⚕️ Doctor  : nirmala@chmp.test");
  console.log("  👩 Parent 1: chamari@parent.test   → Sanuli");
  console.log("  👨 Parent 2: dinesh@parent.test    → Thehan");
  console.log("─────────────────────────────────────────");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
