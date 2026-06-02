import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/db";
import { getAuthUser } from "@/backend/auth";
import { Role } from "@prisma/client";

// Authorization helper
async function checkPatientAccess(
  authUser: { id: string; role: Role },
  patientId: string,
  requireWrite = false
) {
  if (authUser.role === Role.DOCTOR) {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: authUser.id },
    });
    if (!doctor) return null;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient || patient.doctorId !== doctor.id) return null;

    return { patient, isDoctor: true, isCaregiver: false, canEdit: true };
  }

  if (authUser.role === Role.CAREGIVER) {
    const caregiver = await prisma.caregiver.findUnique({
      where: { userId: authUser.id },
    });
    if (!caregiver) return null;

    const assignment = await prisma.patientAssignment.findUnique({
      where: {
        patientId_caregiverId: {
          patientId,
          caregiverId: caregiver.id,
        },
      },
    });

    if (!assignment) return null;
    if (requireWrite && !assignment.canEditMedical) return null;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    return {
      patient,
      isDoctor: false,
      isCaregiver: true,
      canEdit: assignment.canEditMedical,
    };
  }

  if (authUser.role === Role.PATIENT) {
    if (requireWrite) return null; // Patients cannot edit their own medical profile

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient || patient.userId !== authUser.id) return null;

    return { patient, isDoctor: false, isCaregiver: false, canEdit: false };
  }

  return null;
}

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
      return NextResponse.json({ error: "Forbidden: Access denied" }, { status: 403 });
    }

    const fullPatient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { email: true } },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            phone: true,
          },
        },
        caregivers: {
          include: {
            caregiver: true,
          },
        },
        allergies: true,
        emergencyContacts: true,
      },
    });

    return NextResponse.json({
      patient: fullPatient,
      canEdit: access.canEdit,
    });
  } catch (error: any) {
    console.error("Patient GET error:", error);
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
      return NextResponse.json({ error: "Forbidden: Only assigned doctor or authorized caregiver can edit medical information" }, { status: 403 });
    }

    const body = await req.json();
    const { name, age, bloodGroup, address, emergencyContact, profileImage } = body;

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        name,
        age: age ? parseInt(age) : undefined,
        bloodGroup,
        address,
        emergencyContact,
        profileImage,
      },
    });

    return NextResponse.json({
      message: "Patient profile updated successfully",
      patient: updatedPatient,
    });
  } catch (error: any) {
    console.error("Patient PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.DOCTOR) {
      return NextResponse.json({ error: "Forbidden: Only doctors can delete patients" }, { status: 403 });
    }

    const patientId = params.id;
    // Verify this doctor owns the patient
    const doctor = await prisma.doctor.findUnique({
      where: { userId: authUser.id },
    });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient || patient.doctorId !== doctor.id) {
      return NextResponse.json({ error: "Forbidden: Patient not assigned to you" }, { status: 403 });
    }

    // Delete the Patient user account (which cascade deletes the patient profile and all data)
    await prisma.user.delete({
      where: { id: patient.userId },
    });

    return NextResponse.json({
      message: "Patient account deleted successfully",
    });
  } catch (error: any) {
    console.error("Patient DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
