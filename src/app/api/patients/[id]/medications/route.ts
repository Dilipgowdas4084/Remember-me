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
    const medicationId = searchParams.get("medicationId");

    if (medicationId) {
      const medication = await prisma.medication.findFirst({
        where: { id: medicationId, patientId },
      });
      if (!medication) {
        return NextResponse.json({ error: "Medication not found" }, { status: 404 });
      }
      return NextResponse.json({ medication });
    }

    const medications = await prisma.medication.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ medications });
  } catch (error: any) {
    console.error("Medications GET error:", error);
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
    const { name, dosage, frequency, timeOfDay, reminderTime, imageUrl, instructions, active } = body;

    if (!name || !dosage || !frequency || !timeOfDay) {
      return NextResponse.json({ error: "Missing required fields (name, dosage, frequency, timeOfDay)" }, { status: 400 });
    }

    const newMedication = await prisma.medication.create({
      data: {
        patientId,
        name,
        dosage,
        frequency,
        timeOfDay, // Morning, Afternoon, Night
        reminderTime: reminderTime || null,
        imageUrl: imageUrl || null,
        instructions: instructions || null,
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json({ message: "Medication added successfully", medication: newMedication }, { status: 201 });
  } catch (error: any) {
    console.error("Medications POST error:", error);
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
    const { medicationId, name, dosage, frequency, timeOfDay, reminderTime, imageUrl, instructions, active } = body;

    if (!medicationId) {
      return NextResponse.json({ error: "Missing medicationId" }, { status: 400 });
    }

    const updatedMedication = await prisma.medication.update({
      where: { id: medicationId, patientId },
      data: {
        name,
        dosage,
        frequency,
        timeOfDay,
        reminderTime,
        imageUrl,
        instructions,
        active,
      },
    });

    return NextResponse.json({ message: "Medication updated successfully", medication: updatedMedication });
  } catch (error: any) {
    console.error("Medications PATCH error:", error);
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
    const medicationId = searchParams.get("medicationId");

    if (!medicationId) {
      return NextResponse.json({ error: "Missing medicationId in query" }, { status: 400 });
    }

    await prisma.medication.delete({
      where: { id: medicationId, patientId },
    });

    return NextResponse.json({ message: "Medication deleted successfully" });
  } catch (error: any) {
    console.error("Medications DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
