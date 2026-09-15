import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "organiza_ai_super_secret_jwt_key_2026_secure"
);

async function isValidAuthToken(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return Boolean(payload?.id);
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Lista de prefixos/rotas públicas
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/cadastro") ||
    pathname.startsWith("/esqueci-a-senha") ||
    pathname.startsWith("/redefinir-senha") ||
    pathname.startsWith("/verificar-email") ||
    pathname.startsWith("/api/auth/google") ||
    pathname.startsWith("/convite/") ||
    pathname.startsWith("/api-docs");

  const authToken = request.cookies.get("auth_token")?.value;
  const isAuthenticated = await isValidAuthToken(authToken);

  // Se o usuário não está autenticado e tenta acessar uma rota protegida
  if (!isAuthenticated && !isPublicRoute) {
    const redirectUrl = new URL("/login", request.url);
    const destination = pathname + search;
    if (destination !== "/" && destination !== "/login") {
      redirectUrl.searchParams.set("from", destination);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // Se o usuário já está autenticado e acessa telas de login, cadastro ou a landing page raiz (/)
  if (isAuthenticated && (pathname === "/" || pathname === "/login" || pathname === "/cadastro")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Intercepta todas as requisições exceto:
     * - /api (rotas de API cuidam de suas próprias respostas JSON)
     * - /_next/static (arquivos estáticos de build)
     * - /_next/image (otimização de imagens)
     * - favicon.ico e imagens estáticas
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
