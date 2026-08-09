import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function pruneStaleAuthCookies(
  request: NextRequest,
  response: NextResponse,
  cookiesToSet: { name: string }[],
) {
  const keep = new Set(cookiesToSet.map(({ name }) => name));

  for (const { name } of request.cookies.getAll()) {
    if (name.includes("-auth-token") && !keep.has(name)) {
      response.cookies.delete(name);
    }
  }
}

async function fetchUserProfileMeta(
  userId: string,
): Promise<{ role: "customer" | "vendor" | "admin" | null; accountStatus: string | null }> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const { url } = getSupabaseConfig();
  if (!serviceKey || !url) return { role: null, accountStatus: null };

  const admin = createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await admin
    .from("profiles")
    .select("role, account_status")
    .eq("id", userId)
    .maybeSingle();
  return {
    role: (data?.role as "customer" | "vendor" | "admin") ?? null,
    accountStatus: (data?.account_status as string) ?? null,
  };
}

export async function updateSession(request: NextRequest) {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  const pathname = request.nextUrl.pathname;

  if (!isConfigured) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url!, anonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options: CookieOptions;
        }[],
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        pruneStaleAuthCookies(request, supabaseResponse, cookiesToSet);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = pathname.startsWith("/admin");
  const isVendorPortal =
    pathname.startsWith("/vendor") && !pathname.startsWith("/vendor/apply");
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");
  const isSuspendedPage = pathname === "/account-suspended";
  const isSupportPage =
    pathname === "/support" ||
    pathname.startsWith("/support/") ||
    pathname.startsWith("/api/support");

  if (user && !isAuthPage) {
    const { role, accountStatus } = await fetchUserProfileMeta(user.id);

    if (accountStatus === "blocked") {
      const login = new URL("/login", request.url);
      login.searchParams.set("error", "account_blocked");
      const response = NextResponse.redirect(login);
      response.cookies.delete("sb-access-token");
      return response;
    }

    if (
      accountStatus === "suspended" &&
      !isSuspendedPage &&
      !isSupportPage
    ) {
      return NextResponse.redirect(new URL("/account-suspended", request.url));
    }

    if (isAdminRoute && role !== "admin") {
      return NextResponse.redirect(new URL("/account", request.url));
    }

    if (isVendorPortal && role !== "vendor" && role !== "admin") {
      return NextResponse.redirect(new URL("/vendor/apply", request.url));
    }
  } else if (isAdminRoute || isVendorPortal) {
    if (!user) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  return supabaseResponse;
}
