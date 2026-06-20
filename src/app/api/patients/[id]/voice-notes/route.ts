import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/prisma";
import { requireAuth } from "@/backend/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const notes = await prisma.voiceNote.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ notes });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch voice notes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { title, audioUrl, duration } = body;

    if (!title || !audioUrl) {
      return NextResponse.json({ error: "title and audioUrl are required" }, { status: 400 });
    }

    const note = await prisma.voiceNote.create({
      data: { patientId: id, title, audioUrl, duration: duration ?? null },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create voice note" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get("noteId");

  if (!noteId) return NextResponse.json({ error: "noteId required" }, { status: 400 });

  try {
    await prisma.voiceNote.delete({ where: { id: noteId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete voice note" }, { status: 500 });
  }
}
