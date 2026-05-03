import { NextRequest, NextResponse } from 'next/server';
import { getClinicSettings } from '@/lib/db';
import { requireApiKey } from '@/lib/api-auth';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, ngrok-skip-browser-warning, x-api-key',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  // Eliminamos requireApiKey porque este endpoint debe ser accesible por el chatbot frontal

  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id') || 'OkfqLr3tVyRgAEBGAqlgBbatOGU2';
    const settings = await getClinicSettings(clinicId);
    
    // Solo devolvemos lo necesario para el chatbot para mayor seguridad y ligereza
    const publicSettings = {
      openingHour: settings.openingHour ?? 9,
      closingHour: settings.closingHour ?? 18,
      appointmentInterval: settings.appointmentInterval ?? 30,
      showWeekends: settings.showWeekends ?? true,
      allowBookingAtClosingHour: settings.allowBookingAtClosingHour ?? false
    };

    return NextResponse.json(publicSettings, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Public settings endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
