import { NextResponse } from "next/server";
import { searchPatients } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing search query parameter" },
      { status: 400 }
    );
  }

  try {
    const patients = await searchPatients(q.trim());
    return NextResponse.json({ patients });
  } catch (error) {
    console.error("Failed to search patients:", error);
    return NextResponse.json(
      { error: "Failed to search patients" },
      { status: 500 }
    );
  }
}
