import { NextResponse } from 'next/server';
import { updateAppointment, deleteAppointment, getDb } from '@/lib/db';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-webhook-secret, ngrok-skip-browser-warning',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// Handler para PUT /api/appointments/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const { searchParams } = new URL(request.url);
  const clinicId = searchParams.get('clinic_id') || "OkfqLr3tVyRgAEBGAqlgBbatOGU2";

  // Auth check
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
    const updates = await request.json();
    const result = await updateAppointment(clinicId, id, updates);
    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}

// Handler para DELETE /api/appointments/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const { searchParams } = new URL(request.url);
  const clinicId = searchParams.get('clinic_id') || "OkfqLr3tVyRgAEBGAqlgBbatOGU2";

  // Auth check
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
    const result = await deleteAppointment(clinicId, id);
    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}
