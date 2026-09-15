import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=GoogleAuthFailed", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=ConfigurationError", request.url));
  }

  try {
    // 1. Trocar código por tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token error:", tokenData);
      return NextResponse.redirect(new URL("/login?error=GoogleAuthFailed", request.url));
    }

    const { access_token } = tokenData;

    // 2. Obter informações do usuário
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok || !userData.email) {
      console.error("User info error:", userData);
      return NextResponse.redirect(new URL("/login?error=GoogleAuthFailed", request.url));
    }

    const { email, name, picture } = userData;

    // 3. Buscar ou criar o usuário no banco
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || "Usuário",
          image: picture,
          emailVerified: new Date(),
        },
      });
    } else if (!user.emailVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }

    // 4. Criar sessão (JWT)
    const token = await signSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: "/",
    });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Google Callback Error:", error);
    return NextResponse.redirect(new URL("/login?error=ServerError", request.url));
  }
}
