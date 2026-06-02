import { NextResponse } from "next/server";
import { prisma } from "@/backend/db";

export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({
      select: {
        id: true,
        name: true,
        specialization: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ doctors });
  } catch (error: any) {
    console.error("Doctors list GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
