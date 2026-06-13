import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// This route is hit after Google OAuth succeeds.
// It reads the NextAuth session (which contains our JWT), sets it as an httpOnly cookie,
// and redirects the user to the correct dashboard.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.appToken || !session?.appRole) {
      console.error("set-cookie: no appToken in session", session);
      return NextResponse.redirect(new URL("/auth/login?error=google_failed", req.url));
    }

    const { appToken, appRole } = session;

    const dest = roleToPath(appRole);
    const response = NextResponse.redirect(new URL(dest, req.url));

    // Set our existing JWT cookie so the rest of the app works normally
    response.cookies.set("token", appToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (e) {
    console.error("set-cookie error:", e);
    return NextResponse.redirect(new URL("/auth/login?error=server", req.url));
  }
}

function roleToPath(role: string) {
  if (role === "DOCTOR") return "/doctor";
  if (role === "CAREGIVER") return "/caregiver";
  if (role === "SUPERVISOR") return "/supervisor";
  return "/patient";
}
