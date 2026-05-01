import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { patients, appointments, prescriptions, growthRecords, vaccinationRecords } from "@/db/schema";
import { eq, and, or, sql, ilike, gte, lte } from "drizzle-orm";
import { searchPatients } from "@/lib/queries";
import { callGeminiJSON } from "@/lib/ai/gemini";

const systemPrompt = `You are a query parser for a child health records system. Convert natural language queries into structured JSON filters.

Available filter fields:
- nameContains: string (partial name match)
- gender: "male" | "female"
- bloodType: string (e.g. "A+", "O-")
- minAgeWeeks: number
- maxAgeWeeks: number
- hasOverdueVaccines: boolean
- hasActivePrescriptions: boolean
- recentAnomalyStatus: "normal" | "warning" | "risk" (based on latest growth Z-score)

Return ONLY a JSON object with the relevant filters. Omit fields that are not mentioned in the query.

Examples:
Query: "female patients under 1 year with overdue vaccines"
Response: {"gender": "female", "maxAgeWeeks": 52, "hasOverdueVaccines": true}

Query: "patients with weight faltering"
Response: {"recentAnomalyStatus": "risk"}

Query: "show all boys named thehan"
Response: {"nameContains": "thehan", "gender": "male"}

Query: "blood type A+"
Response: {"bloodType": "A+"}

Query: "patients with O negative blood"
Response: {"bloodType": "O-"}`;

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user || session.user.role !== "medical_professional") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const query = body.query;
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {

    // Parse NL query with Gemini
    const filters = await callGeminiJSON<{
      nameContains?: string;
      gender?: "male" | "female";
      bloodType?: string;
      minAgeWeeks?: number;
      maxAgeWeeks?: number;
      hasOverdueVaccines?: boolean;
      hasActivePrescriptions?: boolean;
      recentAnomalyStatus?: "normal" | "warning" | "risk";
    }>(systemPrompt, query, { temperature: 0.1 });

    // Fallback: if Gemini fails to parse, do a simple text search on name and blood type
    if (!filters) {
      const fallbackResults = await searchPatients(query);
      return NextResponse.json({ patients: fallbackResults });
    }

    // Build base query conditions
    const conditions = [];

    if (filters.nameContains) {
      conditions.push(ilike(patients.name, `%${filters.nameContains}%`));
    }
    if (filters.gender) {
      conditions.push(eq(patients.gender, filters.gender));
    }
    if (filters.bloodType) {
      conditions.push(eq(patients.bloodType, filters.bloodType as "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "Unknown"));
    }

    // Age filtering: compute age in weeks from date_of_birth
    if (filters.minAgeWeeks !== undefined || filters.maxAgeWeeks !== undefined) {
      const now = new Date();
      if (filters.maxAgeWeeks !== undefined) {
        const maxDob = new Date(now.getTime() - filters.maxAgeWeeks * 7 * 24 * 60 * 60 * 1000);
        conditions.push(gte(patients.dateOfBirth, maxDob.toISOString().split("T")[0]));
      }
      if (filters.minAgeWeeks !== undefined) {
        const minDob = new Date(now.getTime() - filters.minAgeWeeks * 7 * 24 * 60 * 60 * 1000);
        conditions.push(lte(patients.dateOfBirth, minDob.toISOString().split("T")[0]));
      }
    }

    // Fetch patients matching basic criteria
    let patientRows = await db
      .select({
        id: patients.id,
        name: patients.name,
        dateOfBirth: patients.dateOfBirth,
        gender: patients.gender,
        bloodType: patients.bloodType,
        image: patients.image,
      })
      .from(patients)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Post-filter for vaccine and prescription conditions
    if (filters.hasOverdueVaccines) {
      const now = new Date().toISOString().split("T")[0];
      const overduePatients = await db
        .selectDistinct({ patientId: vaccinationRecords.patientId })
        .from(vaccinationRecords)
        .where(
          and(
            sql`${vaccinationRecords.administeredDate} is null`,
            lte(vaccinationRecords.dueDate, now)
          )
        );
      const overdueIds = new Set(overduePatients.map((r) => r.patientId));
      patientRows = patientRows.filter((p) => overdueIds.has(p.id));
    }

    if (filters.hasActivePrescriptions) {
      const activePatients = await db
        .selectDistinct({ patientId: prescriptions.patientId })
        .from(prescriptions)
        .where(eq(prescriptions.status, "active"));
      const activeIds = new Set(activePatients.map((r) => r.patientId));
      patientRows = patientRows.filter((p) => activeIds.has(p.id));
    }

    if (filters.recentAnomalyStatus) {
      // Get latest growth record for each patient and check Z-score status
      const allGrowthRecords = await db
        .select({
          patientId: growthRecords.patientId,
          weightForAgeZScore: growthRecords.weightForAgeZScore,
          heightForAgeZScore: growthRecords.heightForAgeZScore,
        })
        .from(growthRecords)
        .orderBy(growthRecords.date);

      const latestByPatient = new Map<string, { wz: number | null; hz: number | null }>();
      for (const r of allGrowthRecords) {
        latestByPatient.set(r.patientId, { wz: r.weightForAgeZScore, hz: r.heightForAgeZScore });
      }

      const getStatus = (z: number | null) => {
        if (z === null) return "normal";
        const abs = Math.abs(z);
        if (abs < 2) return "normal";
        if (abs < 3) return "warning";
        return "risk";
      };

      patientRows = patientRows.filter((p) => {
        const latest = latestByPatient.get(p.id);
        if (!latest) return false;
        const wStatus = getStatus(latest.wz);
        const hStatus = getStatus(latest.hz);
        return wStatus === filters.recentAnomalyStatus || hStatus === filters.recentAnomalyStatus;
      });
    }

    // If structured filters returned no results, fallback to simple text search
    if (patientRows.length === 0) {
      const fallbackResults = await searchPatients(query);
      return NextResponse.json({ patients: fallbackResults });
    }

    return NextResponse.json({ patients: patientRows });
  } catch (error) {
    console.error("AI patient search error:", error);
    // Fallback to simple text search on any error
    try {
      const fallbackResults = await searchPatients(query);
      return NextResponse.json({ patients: fallbackResults });
    } catch {
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
  }
}
