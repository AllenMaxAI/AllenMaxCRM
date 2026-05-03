import { NextRequest, NextResponse } from 'next/server';
import { getConversations } from '@/lib/db';
import { requireFirebaseAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const authResult = await requireFirebaseAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const conversations = await getConversations();
    return NextResponse.json(conversations || []);
  } catch (error: any) {
    console.error("Error in conversations API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
