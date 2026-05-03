import { NextRequest, NextResponse } from 'next/server';
import { addMessage } from '@/lib/db';
import { requireApiKey } from '@/lib/api-auth';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-webhook-secret, ngrok-skip-browser-warning',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  // Comprobar ambos headers
  const apiKey = req.headers.get('x-api-key');
  const webhookSecret = req.headers.get('x-webhook-secret');
  
  // Llaves válidas (la nueva del chatbot y la vieja de n8n)
  const VALID_KEYS = [
    process.env.INTERNAL_API_KEY,
    '68f28a1cd06d625367a83399c1c15ddbddaf748c03cce45dfca2d735b5f80a71',
    'c0fc7e12af4a49c2d86329f390146da75cf67ecdace23fce400bc42f090fce7c'
  ];
  
  const isValid = VALID_KEYS.includes(apiKey || '') || VALID_KEYS.includes(webhookSecret || '');
  
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const { conversationId, sender, message, patientName, channel, patientPhone, clinicId } = body;

    if (!conversationId || !sender || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: CORS_HEADERS });
    }

    const targetClinicId = clinicId || "OkfqLr3tVyRgAEBGAqlgBbatOGU2";

    const result = await addMessage(
      targetClinicId,
      conversationId,
      sender as 'paciente' | 'IA',
      message,
      patientName,
      channel,
      patientPhone
    );

    const { conversationId: convId, patientId } = result;
    return NextResponse.json({ success: true, conversationId: convId, patientId }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'n8n Webhook endpoint is active' }, { headers: CORS_HEADERS });
}
