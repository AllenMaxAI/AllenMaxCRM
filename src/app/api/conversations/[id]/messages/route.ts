import { NextRequest, NextResponse } from 'next/server';
import { getMessages } from '@/lib/db';
import { requireFirebaseAuth } from '@/lib/api-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireFirebaseAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const clinicId = (searchParams.get('clinicId') && searchParams.get('clinicId') !== 'null') 
      ? searchParams.get('clinicId') as string 
      : undefined;
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
    const messages = await getMessages(id, clinicId);
    return NextResponse.json(messages || []);
  } catch (error: any) {
    console.error("Error in messages API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
