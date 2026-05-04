import { NextResponse } from 'next/server';
import { getAppointments, addAppointment, getClinicSettings, deleteAppointment, validatePatientOwnership } from '@/lib/db';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-webhook-secret, ngrok-skip-browser-warning',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const clinicId = searchParams.get('clinic_id') || "OkfqLr3tVyRgAEBGAqlgBbatOGU2";
  
  const apiKey = request.headers.get('x-api-key');
  const webhookSecret = request.headers.get('x-webhook-secret');
  const VALID_KEYS = [
    process.env.INTERNAL_API_KEY,
    '68f28a1cd06d625367a83399c1c15ddbddaf748c03cce45dfca2d735b5f80a71',
    'c0fc7e12af4a49c2d86329f390146da75cf67ecdace23fce400bc42f090fce7c'
  ];
  const isAuth = VALID_KEYS.includes(apiKey || '') || VALID_KEYS.includes(webhookSecret || '');
  
  if (!clinicId && !isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
  }

  try {
    const appointments = await getAppointments(clinicId, date || undefined);
    const clinicSettings = await getClinicSettings(clinicId);

    const openH = clinicSettings.openingHour ?? 9;
    const closeH = clinicSettings.closingHour ?? 18;
    const interval = clinicSettings.appointmentInterval ?? 60;
    
    const booked_slots: string[] = [];
    const free_slots: string[] = [];

    appointments.forEach((app: any) => {
      const match = app.start_time.match(/(\d{2}):(\d{2})/);
      if (match) {
        booked_slots.push(`${match[1]}:${match[2]}`);
      }
    });

    if (date) {
      let currentMinutes = openH * 60;
      const endMinutes = closeH * 60;
      
      while (currentMinutes < endMinutes) {
        const h = Math.floor(currentMinutes / 60);
        const m = currentMinutes % 60;
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        
        const isOccupied = booked_slots.includes(timeStr);
        if (!isOccupied) {
          free_slots.push(timeStr);
        }
        currentMinutes += interval;
      }
    }

    return NextResponse.json({ 
      appointments,
      free_slots,
      booked: booked_slots,
      message: `Día ${date}: ${booked_slots.length} ocupados, ${free_slots.length} libres.`
    }, { headers: CORS_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key');
  const webhookSecret = request.headers.get('x-webhook-secret');
  const VALID_KEYS = [
    process.env.INTERNAL_API_KEY,
    '68f28a1cd06d625367a83399c1c15ddbddaf748c03cce45dfca2d735b5f80a71',
    'c0fc7e12af4a49c2d86329f390146da75cf67ecdace23fce400bc42f090fce7c'
  ];
  if (!VALID_KEYS.includes(apiKey || '') && !VALID_KEYS.includes(webhookSecret || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
  }

  try {
    const body = await request.json();
    const clinicId = body.clinic_id || "OkfqLr3tVyRgAEBGAqlgBbatOGU2";
    
    if (!body.start_time) {
      return NextResponse.json({ error: "Missing start_time" }, { status: 400 });
    }

    // Normalizar fechas para Firestore
    let normalizedStartTime = body.start_time.replace('T', ' ').substring(0, 16);
    let normalizedEndTime = body.end_time ? body.end_time.replace('T', ' ').substring(0, 16) : null;
    
    // --- VALIDACIÓN DE IDENTIDAD (Seguridad) ---
    const patientName = body.patient_name || body.name;
    const patientPhone = body.patient_phone || body.phone;
    
    if (patientName && patientPhone) {
      const validation = await validatePatientOwnership(patientPhone, patientName, undefined, clinicId);
      if (!validation.isOwner) {
        return NextResponse.json(
          { error: "⚠️ Este número ya está registrado a nombre de otro paciente. Por favor, introduce el nombre exacto con el que te registraste." },
          { status: 403, headers: CORS_HEADERS }
        );
      }
    }

    // --- BLOQUEO DE SEGURIDAD (Evitar duplicados) ---
    const dateOnly = normalizedStartTime.split(' ')[0];
    const existingApps = await getAppointments(clinicId, dateOnly);
    const isOccupied = existingApps.some((app: any) => 
      app.start_time === normalizedStartTime && app.status !== 'cancelada'
    );

    if (isOccupied) {
      return NextResponse.json(
        { error: "Lo siento, esa hora ya está ocupada. Por favor, busca otro horario." }, 
        { status: 400, headers: CORS_HEADERS }
      );
    }
    // ------------------------------------------------
    
    // Si no hay end_time, sumar 1 hora por defecto
    if (!normalizedEndTime) {
      const start = new Date(normalizedStartTime.replace(' ', 'T'));
      start.setHours(start.getHours() + 1);
      normalizedEndTime = start.toISOString().replace('T', ' ').substring(0, 16);
    }

    // Intentar extraer el tratamiento de los campos o de las notas
    let extractedTreatment = "";
    const officialTreatments = [
      "Ortodoncia Invisible", "Ortodoncia", "Implantes Dentales", 
      "Periodoncia", "Estética Dental", "Cirugía Oral", "Odontopediatría"
    ];
    
    // 1. Buscar si las notas empiezan por un tratamiento oficial (lo más fiable)
    if (body.notes) {
      const lowerNotes = body.notes.toLowerCase();
      const found = officialTreatments.find(t => lowerNotes.startsWith(t.toLowerCase()));
      if (found) extractedTreatment = found;
    }
    
    // 2. Si no, buscar patrón "Tratamiento: X"
    if (!extractedTreatment && body.notes) {
      const treatmentMatch = body.notes.match(/Tratamiento:\s*([^.\n,]+)/i);
      if (treatmentMatch) {
        extractedTreatment = treatmentMatch[1].trim();
      }
    }

    // El título final será el extraído, o el que venga en el body, o "Consulta"
    const finalTreatment = extractedTreatment || body.treatment || body.title || "Consulta";

    const appointment = await addAppointment(clinicId, {
      ...body,
      title: finalTreatment,
      treatment: finalTreatment, // Forzamos que coincida para el CRM
      start_time: normalizedStartTime,
      end_time: normalizedEndTime,
      status: body.status || 'programada',
      source: body.source || 'Agente de voz'
    });
    
    return NextResponse.json(appointment, { headers: CORS_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function DELETE(request: Request) {
  const apiKey = request.headers.get('x-api-key');
  const webhookSecret = request.headers.get('x-webhook-secret');
  const VALID_KEYS = [
    process.env.INTERNAL_API_KEY,
    '68f28a1cd06d625367a83399c1c15ddbddaf748c03cce45dfca2d735b5f80a71',
    'c0fc7e12af4a49c2d86329f390146da75cf67ecdace23fce400bc42f090fce7c'
  ];
  if (!VALID_KEYS.includes(apiKey || '') && !VALID_KEYS.includes(webhookSecret || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clinicId = searchParams.get('clinic_id') || "OkfqLr3tVyRgAEBGAqlgBbatOGU2";
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    const result = await deleteAppointment(clinicId, id);
    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}
