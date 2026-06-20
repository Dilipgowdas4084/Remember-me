import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/prisma";
import { requireAuth } from "@/backend/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const logs = await prisma.medicationLog.findMany({
      where: { patientId: id },
      include: { medication: { select: { name: true, dosage: true, timeOfDay: true } } },
      orderBy: { takenAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ logs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch medication logs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { medicationId, skipped } = body;

    if (!medicationId) return NextResponse.json({ error: "medicationId required" }, { status: 400 });

    const log = await prisma.medicationLog.create({
      data: {
        patientId: id,
        medicationId,
        skipped: skipped ?? false,
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to log medication" }, { status: 500 });
  }
}
