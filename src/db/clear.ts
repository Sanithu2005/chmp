import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://chmp:chmp_dev_password@localhost:5432/chmp_db",
});

const db = drizzle(pool, { schema });

async function clear() {
  console.log("🧹 Clearing all data...");

  await db.delete(schema.prescriptions);
  await db.delete(schema.appointments);
  await db.delete(schema.growthRecords);
  await db.delete(schema.vaccinationRecords);
  await db.delete(schema.parentPatients);
  await db.delete(schema.doctorAvailability);
  await db.delete(schema.patients);
  await db.delete(schema.verifications);
  await db.delete(schema.sessions);
  await db.delete(schema.accounts);
  await db.delete(schema.users);

  console.log("✅ All tables cleared.");
  process.exit(0);
}

clear().catch((error) => {
  console.error("❌ Clearing failed:", error);
  process.exit(1);
});