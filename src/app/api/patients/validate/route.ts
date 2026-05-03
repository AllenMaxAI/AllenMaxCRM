import { NextRequest, NextResponse } from 'next/server';
console.log('--- HEARTBEAT: VALIDATE ROUTE LOADED ---');
import { validatePatientOwnership } from '@/lib/db';
import { requireApiKey } from '@/lib/api-auth';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, ngrok-skip-browser-warning, x-api-key, x-webhook-secret',
};


// Preflight para CORS (el navegador lo lanza antes de la petición real)
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  // Comprobar ambos headers
  const apiKey = req.headers.get('x-api-key');
  const webhookSecret = req.headers.get('x-webhook-secret');
  
  // Llaves válidas
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
    const { phone, name, currentPatientId, clinicId, clinic_id } = body;
    const activeClinicId = clinicId || clinic_id || req.nextUrl.searchParams.get('clinic_id') || "OkfqLr3tVyRgAEBGAqlgBbatOGU2";

    if (!phone || !name) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const result = await validatePatientOwnership(phone, name, currentPatientId, activeClinicId);
    return NextResponse.json(result, { headers: CORS_HEADERS });

  } catch (error) {
    console.error('Validate endpoint error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal Server Error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
