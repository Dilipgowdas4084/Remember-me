import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/db";
import { getAuthUser, checkPatientAccess } from "@/backend/auth";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = params.id;
    const access = await checkPatientAccess(authUser, patientId, false);
    if (!access) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const journalId = searchParams.get("journalId");

    if (journalId) {
      const journal = await prisma.journal.findFirst({
        where: { id: journalId, patientId },
      });
      if (!journal) {
        return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
      }
      return NextResponse.json({ journal });
    }

    const journals = await prisma.journal.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ journals });
  } catch (error: any) {
    console.error("Journals GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = params.id;
    const access = await checkPatientAccess(authUser, patientId, true);
    if (!access) {
      return NextResponse.json({ error: "Forbidden: No write permission" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, mediaUrl, mediaType } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Missing required fields (title, content)" }, { status: 400 });
    }

    const newJournal = await prisma.journal.create({
      data: {
        patientId,
        title,
        content,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null, // IMAGE, VIDEO, VOICE
      },
    });

    return NextResponse.json({ message: "Journal entry created successfully", journal: newJournal }, { status: 201 });
  } catch (error: any) {
    console.error("Journals POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = params.id;
    const access = await checkPatientAccess(authUser, patientId, true);
    if (!access) {
      return NextResponse.json({ error: "Forbidden: No write permission" }, { status: 403 });
    }

    const body = await req.json();
    const { journalId, title, content, mediaUrl, mediaType } = body;

    if (!journalId) {
      return NextResponse.json({ error: "Missing journalId" }, { status: 400 });
    }

    const updatedJournal = await prisma.journal.update({
      where: { id: journalId, patientId },
      data: {
        title,
        content,
        mediaUrl,
        mediaType,
      },
    });

    return NextResponse.json({ message: "Journal entry updated successfully", journal: updatedJournal });
  } catch (error: any) {
    console.error("Journals PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = params.id;
    const access = await checkPatientAccess(authUser, patientId, true);
    if (!access) {
      return NextResponse.json({ error: "Forbidden: No write permission" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const journalId = searchParams.get("journalId");

    if (!journalId) {
      return NextResponse.json({ error: "Missing journalId in query" }, { status: 400 });
    }

    await prisma.journal.delete({
      where: { id: journalId, patientId },
    });

    return NextResponse.json({ message: "Journal entry deleted successfully" });
  } catch (error: any) {
    console.error("Journals DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
