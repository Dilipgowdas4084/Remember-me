import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/db";
import { getAuthUser } from "@/backend/auth";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.SUPERVISOR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const patients = await prisma.patient.findMany({
      include: {
        user: { select: { email: true, createdAt: true } },
        doctor: { select: { name: true, specialization: true, phone: true } },
        caregivers: { include: { caregiver: { select: { name: true, phone: true } } } },
        medications: { where: { active: true }, select: { name: true, dosage: true, timeOfDay: true, frequency: true } },
        reminders: { where: { completed: false }, orderBy: { dateTime: "asc" }, take: 5, select: { title: true, dateTime: true, description: true } },
        emergencyContacts: { select: { name: true, phone: true, relationship: true, isPrimary: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ patients });
  } catch (error) {
    console.error("Supervisor patients error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
