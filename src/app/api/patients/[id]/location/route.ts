import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/db";
import { getAuthUser } from "@/backend/auth";
import { Role } from "@prisma/client";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = params.id;
    
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const isPatientThemself = authUser.role === Role.PATIENT && patient.userId === authUser.id;
    
    // Check if clinician is assigned
    let isDoctorAssigned = false;
    if (authUser.role === Role.DOCTOR) {
      const doctor = await prisma.doctor.findUnique({ where: { userId: authUser.id } });
      if (doctor && patient.doctorId === doctor.id) {
        isDoctorAssigned = true;
      }
    }
    
    // Check if caregiver is assigned
    let isCaregiverAssigned = false;
    if (authUser.role === Role.CAREGIVER) {
      const caregiver = await prisma.caregiver.findUnique({ where: { userId: authUser.id } });
      if (caregiver) {
        const assignment = await prisma.patientAssignment.findUnique({
          where: { patientId_caregiverId: { patientId, caregiverId: caregiver.id } }
        });
        if (assignment) isCaregiverAssigned = true;
      }
    }

    if (!isPatientThemself && !isDoctorAssigned && !isCaregiverAssigned) {
      return NextResponse.json({ error: "Forbidden: Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { latitude, longitude } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Missing latitude or longitude" }, { status: 400 });
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        locationUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Location updated successfully",
      patient: {
        id: updatedPatient.id,
        latitude: updatedPatient.latitude,
        longitude: updatedPatient.longitude,
        locationUpdatedAt: updatedPatient.locationUpdatedAt,
      }
    });
  } catch (error: any) {
    console.error("Location PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
