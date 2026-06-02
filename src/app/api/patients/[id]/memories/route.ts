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
    const memoryId = searchParams.get("memoryId");

    if (memoryId) {
      const memory = await prisma.memory.findFirst({
        where: { id: memoryId, patientId },
      });
      if (!memory) {
        return NextResponse.json({ error: "Memory card not found" }, { status: 404 });
      }
      return NextResponse.json({ memory });
    }

    const memories = await prisma.memory.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ memories });
  } catch (error: any) {
    console.error("Memories GET error:", error);
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
    const { title, description, category, mediaUrl, mediaType, voiceUrl, isNarrated } = body;

    if (!title || !description || !category) {
      return NextResponse.json({ error: "Missing required fields (title, description, category)" }, { status: 400 });
    }

    const newMemory = await prisma.memory.create({
      data: {
        patientId,
        title,
        description,
        category, // PERSON, PLACE, ROUTINE, MEDICATION, OTHER
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null, // IMAGE, VIDEO
        voiceUrl: voiceUrl || null,
        isNarrated: isNarrated !== undefined ? isNarrated : false,
      },
    });

    return NextResponse.json({ message: "Memory card created successfully", memory: newMemory }, { status: 201 });
  } catch (error: any) {
    console.error("Memories POST error:", error);
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
    const { memoryId, title, description, category, mediaUrl, mediaType, voiceUrl, isNarrated } = body;

    if (!memoryId) {
      return NextResponse.json({ error: "Missing memoryId" }, { status: 400 });
    }

    const updatedMemory = await prisma.memory.update({
      where: { id: memoryId, patientId },
      data: {
        title,
        description,
        category,
        mediaUrl,
        mediaType,
        voiceUrl,
        isNarrated,
      },
    });

    return NextResponse.json({ message: "Memory card updated successfully", memory: updatedMemory });
  } catch (error: any) {
    console.error("Memories PATCH error:", error);
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
    const memoryId = searchParams.get("memoryId");

    if (!memoryId) {
      return NextResponse.json({ error: "Missing memoryId in query" }, { status: 400 });
    }

    await prisma.memory.delete({
      where: { id: memoryId, patientId },
    });

    return NextResponse.json({ message: "Memory card deleted successfully" });
  } catch (error: any) {
    console.error("Memories DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
