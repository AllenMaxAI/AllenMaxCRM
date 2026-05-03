import { NextResponse } from "next/server";
import { syncRetellSettings } from "@/lib/retell-sync";
import { requireFirebaseAuth } from "@/lib/api-auth";

export async function POST(request: Request) {
  const authResult = await requireFirebaseAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();

    const { openingHour, closingHour, allowBookingAtClosingHour, appointmentInterval } = body;

    if (openingHour === undefined || closingHour === undefined) {
      return NextResponse.json({ error: "Faltan datos obligatorios (horas)" }, { status: 400 });
    }
    const result = await syncRetellSettings({
      openingHour,
      closingHour,
      allowBookingAtClosingHour,
      appointmentInterval,
      categories: [],
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Retell Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
