import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/db";
import { hashPassword, signToken } from "@/backend/auth";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      role,
      name,
      specialization,
      relationshipToPatient,
      age,
      bloodGroup,
      address,
      emergencyContact,
      profileImage,
      doctorId,
      phone,
      supervisorCode,
    } = body;

    // Validation
    if (!email || !password || !role || !name) {
      return NextResponse.json(
        { error: "Missing required fields (email, password, role, name)" },
        { status: 400 }
      );
    }

    if (!Object.values(Role).includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user and profile transactionally
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          role,
        },
      });

      if (role === Role.DOCTOR) {
        await tx.doctor.create({
          data: {
            userId: newUser.id,
            name,
            specialization,
            phone,
          },
        });
      } else if (role === Role.PATIENT) {
        if (!doctorId) {
          throw new Error("A doctor must be selected for patient assignment.");
        }
        await tx.patient.create({
          data: {
            userId: newUser.id,
            name,
            age: parseInt(age) || 70,
            bloodGroup,
            address,
            emergencyContact,
            profileImage: profileImage || null,
            doctorId,
          },
        });
      } else if (role === Role.CAREGIVER) {
        await tx.caregiver.create({
          data: {
            userId: newUser.id,
            name,
            phone,
            relationshipToPatient,
          },
        });
      } else if (role === Role.SUPERVISOR) {
        const secret = process.env.SUPERVISOR_SECRET || "rememberme-supervisor-2026";
        if (supervisorCode !== secret) {
          throw new Error("Invalid supervisor access code.");
        }
        await tx.supervisor.create({
          data: {
            userId: newUser.id,
            name,
          },
        });
      }

      return newUser;
    });

    // Get user details
    const userDetails = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        doctor: true,
        patient: true,
        caregiver: true,
        supervisor: true,
      },
    });

    // Generate Token
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Create response and set cookie
    const response = NextResponse.json({
      message: "Registration successful",
      user: {
        id: userDetails?.id,
        email: userDetails?.email,
        role: userDetails?.role,
        profile: userDetails?.doctor || userDetails?.patient || userDetails?.caregiver || userDetails?.supervisor,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register user" },
      { status: 500 }
    );
  }
}
