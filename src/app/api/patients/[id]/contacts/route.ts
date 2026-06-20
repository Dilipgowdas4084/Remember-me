import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/prisma";
import { requireAuth } from "@/backend/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const contacts = await prisma.emergencyContact.findMany({
      where: { patientId: id },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ contacts });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, relationship, phone, isPrimary } = body;

    if (!name || !relationship || !phone) {
      return NextResponse.json({ error: "name, relationship and phone are required" }, { status: 400 });
    }

    // If setting as primary, unset previous primary
    if (isPrimary) {
      await prisma.emergencyContact.updateMany({
        where: { patientId: id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.emergencyContact.create({
      data: { patientId: id, name, relationship, phone, isPrimary: isPrimary ?? false },
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("contactId");

  if (!contactId) return NextResponse.json({ error: "contactId required" }, { status: 400 });

  try {
    await prisma.emergencyContact.delete({ where: { id: contactId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
