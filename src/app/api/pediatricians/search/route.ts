import { NextResponse } from "next/server";
import { searchPediatricians } from "@/lib/queries";

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
    const doctors = await searchPediatricians(q.trim());
    return NextResponse.json({ doctors });
  } catch (error) {
    console.error("Failed to search pediatricians:", error);
    return NextResponse.json(
      { error: "Failed to search pediatricians" },
      { status: 500 }
    );
  }
}
