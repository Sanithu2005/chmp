import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date");

  if (!doctorId || !date) {
    return NextResponse.json(
      { error: "Missing doctorId or date query parameter" },
      { status: 400 }
    );
  }

  try {
    const slots = await getAvailableSlots(doctorId, date);
    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Failed to fetch available slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}
