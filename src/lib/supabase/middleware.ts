import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function laLoiRefreshTokenKhongHopLe(error: unknown) {
  const authError = error as { code?: string; message?: string };
  const message = authError.message ?? (error instanceof Error ? error.message : "");

  return (
    authError.code === "refresh_token_not_found" ||
    message.includes("Invalid Refresh Token") ||
    message.includes("Refresh Token Not Found")
  );
}

function xoaCookieAuthSupabase(response: NextResponse, request: NextRequest) {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-") || cookie.name.includes("auth-token")) {
      response.cookies.delete(cookie.name);
    }
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  try {
    await supabase.auth.getUser();
  } catch (error) {
    if (!laLoiRefreshTokenKhongHopLe(error)) {
      throw error;
    }

    const response = NextResponse.next({ request });
    xoaCookieAuthSupabase(response, request);
    return response;
  }

  return supabaseResponse;
}
