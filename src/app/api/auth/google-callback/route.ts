import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/backend/db";
import { signToken } from "@/backend/auth";

// Called after Google OAuth success. Issues our JWT cookie and redirects to the right dashboard.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession() as any;

    // Try to get email from session
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.redirect(new URL("/auth/login?error=google_failed", req.url));
    }

    const dbUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!dbUser) {
      return NextResponse.redirect(new URL("/auth/login?error=not_found", req.url));
    }

    const token = signToken({ id: dbUser.id, email: dbUser.email, role: dbUser.role });

    const dest = roleToPath(dbUser.role);
    const response = NextResponse.redirect(new URL(dest, req.url));
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (e) {
    console.error("google-callback error:", e);
    return NextResponse.redirect(new URL("/auth/login?error=server", req.url));
  }
}

function roleToPath(role: string) {
  if (role === "DOCTOR") return "/doctor";
  if (role === "CAREGIVER") return "/caregiver";
  if (role === "SUPERVISOR") return "/supervisor";
  return "/patient";
}
