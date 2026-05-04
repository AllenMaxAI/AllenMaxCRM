import { NextResponse } from 'next/server';
import { getAppointments, addAppointment } from '@/lib/db';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action'); // e.g. buscar_cita, buscar_disponibilidad, etc.
    const clinicId = searchParams.get('clinic_id') || "OkfqLr3tVyRgAEBGAqlgBbatOGU2";

    const payload = await req.json();
    // Retell Custom Tools manda los parámetros en "args"
    const args = payload.args || payload; 

    console.log(`[Retell Tools] Action: ${action}, Args:`, args);

    if (action === 'buscar_cita') {
      const appointments = await getAppointments(clinicId, args.date, args.phone);
      const formatted = appointments.map(app => ({
        id: app.id,
        treatment: app.treatment || 'Consulta Clínica',
        patient_name: app.patient_name,
        patient_phone: app.patient_phone,
        start_time: app.start_time,
        end_time: app.end_time,
        notes: app.notes,
        status: app.status
      }));
      return NextResponse.json({ appointments: formatted });
    }

    if (action === 'buscar_disponibilidad') {
      const appointments = await getAppointments(clinicId, args.date);
      const { getClinicSettings } = await import('@/lib/db');
      const clinicSettings = await getClinicSettings(clinicId);
      const openH = clinicSettings.openingHour ?? 9;
      const closeH = clinicSettings.closingHour ?? 18;
      const interval = clinicSettings.appointmentInterval ?? 30;
      
      const free_slots = [];
      let currentMinutes = openH * 60;
      const endMinutes = closeH * 60;
      
      while (currentMinutes + interval <= endMinutes) {
        const h = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
        const m = (currentMinutes % 60).toString().padStart(2, '0');
        const slotTimeStr = `${h}:${m}`;
        const slotString = `${args.date} ${slotTimeStr}`;
        
        const isOccupied = appointments.some(app => app.start_time === slotString);
        if (!isOccupied) {
          free_slots.push(slotTimeStr);
        }
        currentMinutes += interval;
      }
      
      return NextResponse.json({
        appointments: appointments.map(a => ({ start_time: a.start_time, end_time: a.end_time })),
        free_slots,
        message: free_slots.length > 0 ? `Hay ${free_slots.length} huecos libres.` : "No hay huecos libres."
      });
    }

    if (action === 'cancelar_cita') {
      if (!args.id) return NextResponse.json({ error: "Falta ID de cita" }, { status: 400 });
      const userRef = doc(db, "users", clinicId);
      const docRef = doc(userRef, "appointments", args.id);
      await deleteDoc(docRef);
      return NextResponse.json({ success: true, message: `Cita ${args.id} cancelada.` });
    }

    if (action === 'crear_cita') {
      // Función para normalizar el tratamiento recibido de Retell a las etiquetas estándar de la clínica
      const normalizeTreatment = (raw: string): string => {
        if (!raw) return "Consulta General";
        const lower = raw.toLowerCase();
        if (lower.includes("periodoncia") || lower.includes("encía") || lower.includes("encias")) return "Periodoncia";
        if (lower.includes("ortopediatria") || lower.includes("infantil") || lower.includes("hijo") || lower.includes("niño") || lower.includes("pediatría")) return "Odontopediatría";
        if (lower.includes("ortodoncia") && (lower.includes("invisible") || lower.includes("invisalign"))) return "Ortodoncia invisible";
        if (lower.includes("ortodoncia") || lower.includes("brackets")) return "Ortodoncia";
        if (lower.includes("implante") || lower.includes("implantes")) return "Implantes dentales";
        if (lower.includes("estetica") || lower.includes("estética") || lower.includes("blanqueamiento") || lower.includes("carilla")) return "Estética dental";
        if (lower.includes("cirugia") || lower.includes("cirugía") || lower.includes("extraccion") || lower.includes("extracción") || lower.includes("muela") || lower.includes("cordal")) return "Cirugía oral";
        if (lower.includes("endodoncia") || lower.includes("nervio")) return "Endodoncia";
        if (lower.includes("limpieza") || lower.includes("higiene") || lower.includes("tartrectomia")) return "Limpieza dental";
        if (lower.includes("empaste") || lower.includes("obturacion") || lower.includes("caries")) return "Odontología conservadora"; // o Consulta General si prefieres
        return "Consulta General";
      };

      const mappedTreatment = normalizeTreatment(args.treatment);

      const newApp = {
        patient_name: args.patient_name,
        patient_phone: args.patient_phone,
        start_time: args.start_time,
        end_time: args.end_time,
        notes: args.notes || "",
        treatment: mappedTreatment,
        original_treatment_dictated: args.treatment || "", // Guardamos el original por si acaso
        source: "Agente de voz",
        status: "programada"
      };
      const id = await addAppointment(clinicId, newApp);
      return NextResponse.json({ id, ...newApp });
    }

    return NextResponse.json({ error: "Acción no reconocida. Usa ?action=buscar_cita, etc." }, { status: 400 });

  } catch (error: any) {
    console.error("[Retell Tools] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
