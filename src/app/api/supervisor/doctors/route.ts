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

    const doctors = await prisma.doctor.findMany({
      include: {
        user: { select: { email: true, createdAt: true } },
        patients: {
          include: {
            user: { select: { email: true } },
            caregivers: { include: { caregiver: { select: { name: true, phone: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error("Supervisor doctors error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
