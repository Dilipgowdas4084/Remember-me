import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/prisma";
import { requireAuth } from "@/backend/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const logs = await prisma.moodLog.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json({ logs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch mood logs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { mood, note } = body;

    if (!mood) return NextResponse.json({ error: "Mood is required" }, { status: 400 });

    const log = await prisma.moodLog.create({
      data: { patientId: id, mood, note: note ?? null },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to log mood" }, { status: 500 });
  }
}
