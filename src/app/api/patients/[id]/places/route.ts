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
    const placeId = searchParams.get("placeId");

    if (placeId) {
      const place = await prisma.place.findFirst({
        where: { id: placeId, patientId },
      });
      if (!place) {
        return NextResponse.json({ error: "Place not found" }, { status: 404 });
      }
      return NextResponse.json({ place });
    }

    const places = await prisma.place.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ places });
  } catch (error: any) {
    console.error("Places GET error:", error);
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
    const { name, address, description, photoUrl, voiceUrl, mapsUrl } = body;

    if (!name || !description) {
      return NextResponse.json({ error: "Missing required fields (name, description)" }, { status: 400 });
    }

    const newPlace = await prisma.place.create({
      data: {
        patientId,
        name,
        address: address || null,
        description,
        photoUrl: photoUrl || null,
        voiceUrl: voiceUrl || null,
        mapsUrl: mapsUrl || null,
      },
    });

    return NextResponse.json({ message: "Place added successfully", place: newPlace }, { status: 201 });
  } catch (error: any) {
    console.error("Places POST error:", error);
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
    const { placeId, name, address, description, photoUrl, voiceUrl, mapsUrl } = body;

    if (!placeId) {
      return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
    }

    const updatedPlace = await prisma.place.update({
      where: { id: placeId, patientId },
      data: {
        name,
        address,
        description,
        photoUrl,
        voiceUrl,
        mapsUrl,
      },
    });

    return NextResponse.json({ message: "Place updated successfully", place: updatedPlace });
  } catch (error: any) {
    console.error("Places PATCH error:", error);
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
    const placeId = searchParams.get("placeId");

    if (!placeId) {
      return NextResponse.json({ error: "Missing placeId in query" }, { status: 400 });
    }

    await prisma.place.delete({
      where: { id: placeId, patientId },
    });

    return NextResponse.json({ message: "Place deleted successfully" });
  } catch (error: any) {
    console.error("Places DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
