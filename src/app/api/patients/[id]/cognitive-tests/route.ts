import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/prisma";
import { requireAuth } from "@/backend/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const sessions = await prisma.cognitiveTestSession.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ sessions });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch cognitive tests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { gameType, score, totalQ, correctQ, durationMs } = body;

    if (!gameType || score === undefined || !totalQ || correctQ === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await prisma.cognitiveTestSession.create({
      data: {
        patientId: id,
        gameType,
        score,
        totalQ,
        correctQ,
        durationMs: durationMs ?? null,
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save test session" }, { status: 500 });
  }
}
