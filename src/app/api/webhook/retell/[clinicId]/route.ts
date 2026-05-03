import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { requireApiKey } from '@/lib/api-auth';

// Esta ruta acepta clinicId directamente en la URL: /api/webhook/retell/[clinicId]
export async function POST(
  req: NextRequest,
  { params }: { params: { clinicId: string } }
) {
  const clinicId = params.clinicId;
  const { nextUrl } = req;
  const apiKey = nextUrl.searchParams.get('api_key');

  console.log(`[Retell Dynamic Webhook] Petición recibida para clínica: ${clinicId}`);
  console.log(`[Retell Dynamic Webhook] API Key presente: ${!!apiKey}`);

  if (!clinicId) {
    return NextResponse.json({ error: 'clinic_id is required in the path' }, { status: 400 });
  }
  
  // Validar API Key
  const authError = requireApiKey(req, clinicId);
  if (authError) {
    console.error(`[Retell Dynamic Webhook] Error de autenticación para clínica ${clinicId}`);
    return authError;
  }

  try {
    const userRef = doc(db, "users", clinicId);
    const payload = await req.json();
    const { event, call } = payload;

    console.log(`[Retell Dynamic Webhook] Evento: ${event}, Call ID: ${call?.call_id}`);

    if (event !== 'call_ended' && event !== 'call_analyzed') {
      return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    }

    let detectedIntent = call.call_analysis?.custom_analysis_data?.intent || 
                         call.custom_analysis_data?.intent || 
                         "Consulta";
    
    let collectedName = call.call_analysis?.custom_analysis_data?.patient_name || 
                        call.custom_analysis_data?.patient_name || "";

    let transcript = call.transcript || "";
    transcript = transcript.replace(/\(inaudible speech\)/gi, "(ininteligible)");
    const transcriptLower = transcript.toLowerCase();
    
    if (detectedIntent === "Consulta") {
      if (transcriptLower.includes('cita') || transcriptLower.includes('reservar')) detectedIntent = "Cita";
      else if (transcriptLower.includes('presupuesto')) detectedIntent = "Presupuesto";
      else if (transcriptLower.includes('dolor') || transcriptLower.includes('urgencia')) detectedIntent = "Urgencia";
    }

    const analysis = call.call_analysis || {};
    const custom = analysis.custom_analysis_data || call.custom_analysis_data || {};
    
    let summary = analysis.call_summary || 
                  analysis.summary || 
                  custom.summary || 
                  custom.call_summary ||
                  custom["Call Summary"] ||
                  custom["summary"] ||
                  custom["resumen"] ||
                  custom["Resumen"];

    if (event === 'call_analyzed' && !summary && transcript.length > 50) {
      try {
        const { output } = await ai.generate({
          prompt: `Eres un asistente experto analizando llamadas telefónicas de una clínica dental. Lee la siguiente transcripción y genera un "resumen inteligente" muy profesional y detallado (2 a 4 frases). 
          Transcripción: ${transcript}`,
          output: { schema: z.object({ summary: z.string() }) }
        });
        if (output?.summary) summary = output.summary;
      } catch (aiError) {
        console.error('Error generating AI summary fallback:', aiError);
      }
    }

    if (!summary && transcript.length > 50 && event === 'call_ended') {
      summary = "Generando resumen inteligente...";
    }

    if (!summary) summary = "Sin resumen disponible";

    const totalSeconds = Math.round(call.duration_ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Normalización inteligente del número del paciente
    const direction = call.direction || 'inbound';
    let rawPhone = direction === 'inbound' ? call.from_number : call.to_number;
    
    // Si por algún motivo el número detectado está vacío, probamos el otro como fallback
    if (!rawPhone) rawPhone = call.from_number || call.to_number || "";

    let cleanPhone = rawPhone.replace(/\s+/g, '').replace(/-/g, '');
    
    // Si es un número español (empieza por 6, 7, 8, 9) y tiene 9 dígitos, asegurar +34
    // También manejamos si viene con 0034
    if (cleanPhone.startsWith('0034')) cleanPhone = '+' + cleanPhone.substring(2);
    if (!cleanPhone.startsWith('+') && cleanPhone.length === 9 && /^[6789]/.test(cleanPhone)) {
      cleanPhone = `+34${cleanPhone}`;
    }

    const callData = {
      call_id: call.call_id,
      clinic_id: clinicId,
      phone_number: cleanPhone || "Web Test",
      patient_name_collected: collectedName || "",
      transcript: transcript || "No transcript available",
      summary: summary,
      duration: formattedDuration,
      intent: detectedIntent,
      sentiment: analysis.user_sentiment || "Neutral",
      recording_url: call.recording_url,
      timestamp: new Date(call.start_timestamp).toISOString(),
      updated_at: Timestamp.now()
    };

    const callsRef = collection(userRef, "calls");
    const q = query(callsRef, where("call_id", "==", call.call_id));
    const existingCalls = await getDocs(q);

    let docId = call.call_id;

    if (!existingCalls.empty) {
      docId = existingCalls.docs[0].id;
      await updateDoc(doc(userRef, "calls", docId), callData);
    } else {
      await setDoc(doc(userRef, "calls", docId), { ...callData, created_at: Timestamp.now() }, { merge: true });
    }

    return NextResponse.json({ 
      message: 'Webhook processed successfully via dynamic route',
      call_id: call.call_id,
      event: event
    }, { status: 200 });

  } catch (error: any) {
    console.error('Retell Dynamic Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
