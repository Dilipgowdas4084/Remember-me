import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/db";
import { getAuthUser } from "@/backend/auth";

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        doctor: true,
        patient: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true,
              },
            },
          },
        },
        caregiver: {
          include: {
            patients: {
              include: {
                patient: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.doctor || user.patient || user.caregiver,
      },
    });
  } catch (error: any) {
    console.error("Auth Me GET API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Logout endpoint
  const response = NextResponse.json({ message: "Logged out successfully" });
  response.cookies.set("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return response;
}
