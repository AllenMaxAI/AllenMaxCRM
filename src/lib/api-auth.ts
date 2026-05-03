import { NextResponse, NextRequest } from 'next/server';

/**
 * Valida que la petición lleve una API Key correcta.
 * Soporta:
 * 1. Header 'x-api-key'
 * 2. Header 'Authorization: Bearer <key>'
 * 3. Parámetro de consulta '?api_key=<key>'
 */
export function requireApiKey(req: NextRequest, clinicId?: string | null): NextResponse | null {
  const { nextUrl } = req;
  const authHeader = req.headers.get('authorization');
  
  const apiKey = req.headers.get('x-api-key') || 
                 (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader) ||
                 nextUrl.searchParams.get('api_key');

  console.log(`[API Auth] Validando para ${nextUrl.pathname}. Key detectada: ${apiKey ? 'SI' : 'NO'}`);

  const internalKey = process.env.INTERNAL_API_KEY;

  if (!internalKey) {
    console.error('[Auth] INTERNAL_API_KEY no está configurada en el servidor.');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  // 1. Validar contra la clave interna global
  if (apiKey === internalKey) {
    return null; // OK
  }

  // 2. Validar contra la clave específica del usuario (amx_live_...) si tenemos el clinicId
  if (clinicId && apiKey?.startsWith('amx_live_')) {
    const expectedKey = `amx_live_${clinicId.substring(0, 8)}_${clinicId.substring(clinicId.length - 8)}`;
    if (apiKey === expectedKey) {
      return null; // OK
    }
  }

  console.warn(`[Auth] Petición rechazada: API Key inválida o ausente. Recibida: ${apiKey?.substring(0, 12)}...`);
  return NextResponse.json({ error: 'Unauthorized: API key inválida o ausente.' }, { status: 401 });
}

/**
 * Valida que la petición lleve un Firebase ID Token válido en el header Authorization.
 * Para llamadas desde el browser (CRM autenticado).
 * Devuelve el uid del usuario si es válido, o un NextResponse 401 si falla.
 */
export async function requireFirebaseAuth(
  request: Request
): Promise<{ uid: string } | NextResponse> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    console.warn('[Auth] Petición rechazada: falta el token Bearer de Firebase.');
    return NextResponse.json({ error: 'Unauthorized: se requiere autenticación.' }, { status: 401 });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const { adminAuth } = await import('@/lib/firebase-admin');
    const decoded = await adminAuth.verifyIdToken(idToken);
    return { uid: decoded.uid };
  } catch (error) {
    console.warn('[Auth] Token Firebase inválido o expirado:', error);
    return NextResponse.json({ error: 'Unauthorized: token inválido o expirado.' }, { status: 401 });
  }
}

