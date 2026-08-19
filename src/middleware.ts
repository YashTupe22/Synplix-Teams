import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Validate that a redirect path is safe (relative path only, no external URLs).
 * Prevents open redirect attacks.
 */
function sanitizeRedirectPath(path: string): string {
  // Must start with / and not contain protocol (://) or // (protocol-relative)
  if (!path.startsWith("/") || path.includes("://") || path.startsWith("//")) {
    return "/dashboard";
  }
  // Ensure it's a path, not a data: or javascript: URL
  if (path.toLowerCase().startsWith("/data:") || path.toLowerCase().startsWith("/javascript:")) {
    return "/dashboard";
  }
  return path;
}

export async function middleware(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.cookies.toString());
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session - important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/forgot-password"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Auth callback/confirm routes
  const isAuthRoute = pathname.startsWith("/auth/");

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute && !isAuthRoute && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Sanitize the redirect path to prevent open redirect attacks
    url.searchParams.set("redirect_to", sanitizeRedirectPath(pathname));
    return NextResponse.redirect(url);
  }

  // If user is authenticated, check if account is active
  if (user && !isPublicRoute && !isAuthRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", user.id)
      .single();

    // If profile doesn't exist or user is inactive, sign out and redirect to login
    if (!profile || !profile.is_active) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "account_inactive");
      return NextResponse.redirect(url);
    }
  }

  // If user is authenticated and trying to access login page, redirect to dashboard
  if (user && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
