import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/db";
import { getAuthUser, hashPassword } from "@/backend/auth";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authUser.role === Role.DOCTOR) {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: authUser.id },
      });
      if (!doctor) {
        return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
      }

      const patients = await prisma.patient.findMany({
        where: { doctorId: doctor.id },
        include: {
          user: {
            select: {
              email: true,
            },
          },
          caregivers: {
            include: {
              caregiver: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return NextResponse.json({ patients });
    } else if (authUser.role === Role.CAREGIVER) {
      const caregiver = await prisma.caregiver.findUnique({
        where: { userId: authUser.id },
      });
      if (!caregiver) {
        return NextResponse.json({ error: "Caregiver profile not found" }, { status: 404 });
      }

      const assignments = await prisma.patientAssignment.findMany({
        where: { caregiverId: caregiver.id },
        include: {
          patient: {
            include: {
              doctor: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      const patients = assignments.map((a) => ({
        ...a.patient,
        canEditMedical: a.canEditMedical,
      }));

      return NextResponse.json({ patients });
    } else if (authUser.role === Role.PATIENT) {
      const patient = await prisma.patient.findUnique({
        where: { userId: authUser.id },
        include: {
          doctor: {
            select: {
              name: true,
              specialization: true,
              phone: true,
            },
          },
        },
      });

      return NextResponse.json({ patient });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 403 });
  } catch (error: any) {
    console.error("Patients GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.DOCTOR) {
      return NextResponse.json({ error: "Forbidden: Only doctors can create patients" }, { status: 403 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: authUser.id },
    });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { email, password, name, age, bloodGroup, address, emergencyContact, profileImage } = body;

    if (!email || !password || !name || !age) {
      return NextResponse.json({ error: "Missing required fields (email, password, name, age)" }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    // Create user and patient profile
    const newPatient = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: Role.PATIENT,
        },
      });

      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          name,
          age: parseInt(age),
          bloodGroup: bloodGroup || null,
          address: address || null,
          emergencyContact: emergencyContact || null,
          profileImage: profileImage || null,
          doctorId: doctor.id,
        },
      });

      return patient;
    });

    return NextResponse.json({
      message: "Patient registered successfully",
      patient: newPatient,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Patients POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to create patient" }, { status: 500 });
  }
}
