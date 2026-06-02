import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "@/backend/db";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "rememberme_secret_key_2026_fallback";

export interface JWTPayload {
  id: string;
  email: string;
  role: Role;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Sign JWT token
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Authenticate request and return payload
export function getAuthUser(req: NextRequest): JWTPayload | null {
  // Try Cookie first
  const cookieToken = req.cookies.get("token")?.value;
  if (cookieToken) {
    const verified = verifyToken(cookieToken);
    if (verified) return verified;
  }

  // Try Authorization Header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return verifyToken(token);
  }

  return null;
}

// Role-based verification wrapper
export function verifyRole(req: NextRequest, roles: Role[]): JWTPayload | null {
  const user = getAuthUser(req);
  if (!user) return null;
  if (!roles.includes(user.role)) return null;
  return user;
}

// Check if user is authorized to read or write to a specific patient
export async function checkPatientAccess(
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
