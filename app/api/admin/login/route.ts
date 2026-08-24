import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  adminAuthIsConfigured,
  adminCookieOptions,
  createAdminSessionToken,
  validAdminCredentials,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

function loginRedirect(request: Request, error?: string) {
  const url = new URL("/admin/login", request.url);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  if (!adminAuthIsConfigured()) return loginRedirect(request, "configuration");

  try {
    const formData = await request.formData();
    const username = String(formData.get("username") ?? "").trim().slice(0, 100);
    const password = String(formData.get("password") ?? "").slice(0, 200);

    if (!validAdminCredentials(username, password)) {
      await new Promise((resolve) => setTimeout(resolve, 650));
      return loginRedirect(request, "credentials");
    }

    const response = NextResponse.redirect(new URL("/admin", request.url), 303);
    response.cookies.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), adminCookieOptions);
    response.headers.set("cache-control", "no-store");
    return response;
  } catch {
    return loginRedirect(request, "request");
  }
}
