import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// connection string from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://chmp:chmp_dev_password@localhost:5432/chmp_db",
});

export const db = drizzle(pool, { schema });
