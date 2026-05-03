import { NextRequest, NextResponse } from 'next/server';
import { deleteConversation } from '@/lib/db';
import { requireFirebaseAuth } from '@/lib/api-auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireFirebaseAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const id = params.id;
  deleteConversation(id);
  return NextResponse.json({ success: true });
}
