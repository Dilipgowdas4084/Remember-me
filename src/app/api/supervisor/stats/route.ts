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

    const [doctors, patients, caregivers, reminders] = await Promise.all([
      prisma.doctor.count(),
      prisma.patient.count(),
      prisma.caregiver.count(),
      prisma.reminder.count({ where: { completed: false } }),
    ]);

    return NextResponse.json({ doctors, patients, caregivers, pendingReminders: reminders });
  } catch (error) {
    console.error("Supervisor stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
