import { NextRequest, NextResponse } from 'next/server';
import { addMessage } from '@/lib/db';
import { requireFirebaseAuth } from '@/lib/api-auth';

const N8N_WEBHOOK_URL = 'https://feve.app.n8n.cloud/webhook/demo-topdentist';

export async function POST(req: NextRequest) {
  const authResult = await requireFirebaseAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {

    const body = await req.json();
    const { message, sessionId, userProfile } = body;

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Missing message or sessionId' }, { status: 400 });
    }

    // 1. Log the user's message to CRM DB
    const patientName = userProfile?.name || 'Paciente n8n';
    const patientPhone = userProfile?.phone || '';
    
    // Usamos el UID del usuario autenticado para asegurar que se guarde en SU clínica
    await addMessage(authResult.uid, sessionId, 'paciente', message, patientName, 'Chatbot Web', patientPhone);

    // 2. Forward to n8n
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatInput: message,
        message: message,
        sessionId: sessionId,
        userProfile: userProfile,
        clinicId: authResult.uid // También pasamos el clinicId a n8n por si lo necesita
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      return NextResponse.json({ error: `n8n error: ${errorText}` }, { status: n8nResponse.status });
    }

    const contentType = n8nResponse.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await n8nResponse.json();
    } else {
      const text = await n8nResponse.text();
      data = { output: text };
    }
    
    // 3. Extract bot response (logic from visualizer)
    let botMessage = '';
    if (typeof data === 'string') botMessage = data;
    else if (data.output) botMessage = data.output;
    else if (data.message) botMessage = data.message;
    else if (data.response) botMessage = data.response;
    else botMessage = JSON.stringify(data);

    // 4. Log the bot's response to CRM DB
    await addMessage(authResult.uid, sessionId, 'IA', botMessage, patientName, 'Chatbot Web', patientPhone);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
