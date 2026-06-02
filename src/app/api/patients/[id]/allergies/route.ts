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
    const allergyId = searchParams.get("allergyId");

    if (allergyId) {
      const allergy = await prisma.allergy.findFirst({
        where: { id: allergyId, patientId },
      });
      if (!allergy) {
        return NextResponse.json({ error: "Allergy not found" }, { status: 404 });
      }
      return NextResponse.json({ allergy });
    }

    const allergies = await prisma.allergy.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ allergies });
  } catch (error: any) {
    console.error("Allergies GET error:", error);
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
    const { type, item, reaction, severity } = body;

    if (!type || !item || !severity) {
      return NextResponse.json({ error: "Missing required fields (type, item, severity)" }, { status: 400 });
    }

    const newAllergy = await prisma.allergy.create({
      data: {
        patientId,
        type, // FOOD, MEDICINE, ENVIRONMENT, OTHER
        item,
        reaction: reaction || null,
        severity, // LOW, MEDIUM, HIGH
      },
    });

    return NextResponse.json({ message: "Allergy added successfully", allergy: newAllergy }, { status: 201 });
  } catch (error: any) {
    console.error("Allergies POST error:", error);
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
    const { allergyId, type, item, reaction, severity } = body;

    if (!allergyId) {
      return NextResponse.json({ error: "Missing allergyId" }, { status: 400 });
    }

    const updatedAllergy = await prisma.allergy.update({
      where: { id: allergyId, patientId },
      data: {
        type,
        item,
        reaction,
        severity,
      },
    });

    return NextResponse.json({ message: "Allergy updated successfully", allergy: updatedAllergy });
  } catch (error: any) {
    console.error("Allergies PATCH error:", error);
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
    const allergyId = searchParams.get("allergyId");

    if (!allergyId) {
      return NextResponse.json({ error: "Missing allergyId in query" }, { status: 400 });
    }

    await prisma.allergy.delete({
      where: { id: allergyId, patientId },
    });

    return NextResponse.json({ message: "Allergy deleted successfully" });
  } catch (error: any) {
    console.error("Allergies DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
