import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { requireApiKey } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const { nextUrl } = req;
  const url = nextUrl.toString();
  
  // Intentar obtener de la forma oficial de Next.js
  let clinicId = req.headers.get('x-clinic-id') || nextUrl.searchParams.get('clinic_id');
  let apiKey = req.headers.get('x-api-key') || nextUrl.searchParams.get('api_key');

  // Fallback de emergencia: Escaneo manual de la URL
  if (!clinicId && url.includes('clinic_id=')) {
    const params = new URLSearchParams(url.split('?')[1]);
    clinicId = params.get('clinic_id');
    if (!apiKey) apiKey = params.get('api_key');
  }

  console.log(`[Retell Webhook] URL Detectada: ${url}`);
  console.log(`[Retell Webhook] Clinic ID: ${clinicId}, API Key: ${apiKey ? 'PRESENTE' : 'AUSENTE'}`);

  if (!clinicId) {
    console.error('[Retell Webhook] Error: clinic_id missing');
    return NextResponse.json({ 
      error: 'clinic_id is required in the URL parameters',
      received_url: url 
    }, { status: 400 });
  }
  
  const authError = requireApiKey(req, clinicId);
  if (authError) return authError;

  try {
    const userRef = doc(db, "users", clinicId);

    const payload = await req.json();
    const { event, call } = payload;

    console.log(`[Retell Webhook] Evento recibido: ${event}`);

    if (event !== 'call_ended' && event !== 'call_analyzed') {
      return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    }

    let detectedIntent = call.call_analysis?.custom_analysis_data?.intent || 
                         call.custom_analysis_data?.intent || 
                         "Consulta";
    
    let collectedName = call.call_analysis?.custom_analysis_data?.patient_name || 
                        call.custom_analysis_data?.patient_name || "";

    let collectedPhone = call.call_analysis?.custom_analysis_data?.patient_phone || 
                         call.custom_analysis_data?.patient_phone || 
                         call.call_analysis?.custom_analysis_data?.phone ||
                         call.custom_analysis_data?.phone || "";

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
          Instrucciones:
          1. Escribe en tercera persona.
          2. Identifica claramente la intención del paciente (quiere cita, pregunta precio, urgencia, etc.).
          3. Menciona qué acción tomó la recepcionista o IA (agendó, no pudo agendar, derivó, etc.).
          4. Usa un tono formal pero cercano.
          
          Transcripción: 
          ${transcript}`,
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

    if (!summary) summary = analysis.agent_task_completion_rating || "Sin resumen disponible";

    const totalSeconds = Math.round(call.duration_ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Preferimos el teléfono dictado y analizado, si no, caemos al Caller ID original
    let phoneNumber = collectedPhone || call.from_number || call.to_number || "Web Test";
    
    // Normalizar si es español
    if (phoneNumber.startsWith('6') && phoneNumber.length === 9) {
      phoneNumber = '+34' + phoneNumber;
    } else if (phoneNumber.startsWith('+6262')) {
      phoneNumber = '+3462' + phoneNumber.slice(3);
    } else if (phoneNumber.startsWith('+62') && phoneNumber.length === 10) {
      phoneNumber = '+3462' + phoneNumber.slice(3);
    }

    const callData = {
      call_id: call.call_id,
      clinic_id: clinicId,
      phone_number: phoneNumber,
      patient_name_collected: collectedName || "",
      transcript: transcript || "No transcript available",
      summary: summary || "Sin resumen disponible",
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

    let docId = call.call_id; // Determinist ID prevents race conditions

    if (!existingCalls.empty) {
      const docs = existingCalls.docs;
      
      // If we already have one, keep updating it
      docId = docs[0].id;
      await updateDoc(doc(userRef, "calls", docId), callData);
      
      // Delete any duplicates caused by previous race conditions
      for (let i = 1; i < docs.length; i++) {
        await deleteDoc(doc(userRef, "calls", docs[i].id));
      }
    } else {
      // Create new with deterministic ID
      await setDoc(doc(userRef, "calls", docId), { ...callData, created_at: Timestamp.now() }, { merge: true });
    }

    const safePhoneNumber = callData.phone_number || "Web Test";
    const cleanPhone = safePhoneNumber.replace(/[\s\-\(\)\+]/g, '');
    const patientsRef = collection(userRef, "patients");
    const snapshot = await getDocs(patientsRef);
    
    let linkedPatientId = "";
    let linkedPatientName = "";
    if (cleanPhone.length > 5 && cleanPhone !== "WebTest") {
      snapshot.forEach((doc) => {
        const p = doc.data();
        const pPhone = p.phone?.replace(/[\s\-\(\)\+]/g, '') || "";
        if (pPhone && pPhone.length > 5 && (pPhone.endsWith(cleanPhone) || cleanPhone.endsWith(pPhone))) {
          linkedPatientId = doc.id;
          linkedPatientName = p.name;
        }
      });
    }

    if (linkedPatientId) {
      await updateDoc(doc(userRef, "calls", docId), { 
        patient_id: linkedPatientId,
        patient_name: linkedPatientName 
      });
    }

    return NextResponse.json({ 
      message: 'Webhook processed successfully',
      call_id: call.call_id,
      event: event
    }, { status: 200 });

  } catch (error: any) {
    console.error('Retell Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
