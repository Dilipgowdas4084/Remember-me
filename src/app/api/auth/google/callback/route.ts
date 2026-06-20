import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/db";
import { signToken } from "@/backend/auth";

// Step 2: Google redirects here with an auth code. We exchange it for user info,
// find/create the user in our DB, issue our JWT cookie, and redirect to dashboard.
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.redirect(new URL("/auth/login?error=no_code", req.url));
    }

    const origin = req.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    // Exchange the authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Google token exchange failed:", tokenData);
      return NextResponse.redirect(new URL("/auth/login?error=token_failed", req.url));
    }

    // Get user info from Google
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userInfoRes.json();

    if (!googleUser.email) {
      return NextResponse.redirect(new URL("/auth/login?error=no_email", req.url));
    }

    // Find or create user in our database
    let dbUser = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!dbUser) {
      // New Google user — create as PATIENT (doctor can assign them later)
      dbUser = await prisma.user.create({
        data: {
          email: googleUser.email,
          passwordHash: "GOOGLE_OAUTH_NO_PASSWORD",
          role: "PATIENT",
        },
      });
    }

    // Issue our JWT cookie
    const jwtToken = signToken({
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
    });

    // Redirect to the correct dashboard
    const dest = roleToPath(dbUser.role);
    const response = NextResponse.redirect(new URL(dest, req.url));

    response.cookies.set("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (e) {
    console.error("Google callback error:", e);
    return NextResponse.redirect(new URL("/auth/login?error=server", req.url));
  }
}

function roleToPath(role: string) {
  if (role === "DOCTOR") return "/doctor";
  if (role === "CAREGIVER") return "/caregiver";
  if (role === "SUPERVISOR") return "/supervisor";
  return "/patient";
}
