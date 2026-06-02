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
    const personId = searchParams.get("personId");

    if (personId) {
      const person = await prisma.knownPerson.findFirst({
        where: { id: personId, patientId },
      });
      if (!person) {
        return NextResponse.json({ error: "Person not found" }, { status: 404 });
      }
      return NextResponse.json({ person });
    }

    const people = await prisma.knownPerson.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ people });
  } catch (error: any) {
    console.error("People GET error:", error);
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
    const { name, relationship, description, photoUrl, voiceUrl, positiveMemory } = body;

    if (!name || !relationship || !description) {
      return NextResponse.json({ error: "Missing required fields (name, relationship, description)" }, { status: 400 });
    }

    const newPerson = await prisma.knownPerson.create({
      data: {
        patientId,
        name,
        relationship,
        description,
        photoUrl: photoUrl || null,
        voiceUrl: voiceUrl || null,
        positiveMemory: positiveMemory || null,
      },
    });

    return NextResponse.json({ message: "Person added successfully", person: newPerson }, { status: 201 });
  } catch (error: any) {
    console.error("People POST error:", error);
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
    const { personId, name, relationship, description, photoUrl, voiceUrl, positiveMemory } = body;

    if (!personId) {
      return NextResponse.json({ error: "Missing personId" }, { status: 400 });
    }

    const updatedPerson = await prisma.knownPerson.update({
      where: { id: personId, patientId },
      data: {
        name,
        relationship,
        description,
        photoUrl,
        voiceUrl,
        positiveMemory,
      },
    });

    return NextResponse.json({ message: "Person updated successfully", person: updatedPerson });
  } catch (error: any) {
    console.error("People PATCH error:", error);
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
    const personId = searchParams.get("personId");

    if (!personId) {
      return NextResponse.json({ error: "Missing personId in query" }, { status: 400 });
    }

    await prisma.knownPerson.delete({
      where: { id: personId, patientId },
    });

    return NextResponse.json({ message: "Person deleted successfully" });
  } catch (error: any) {
    console.error("People DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
