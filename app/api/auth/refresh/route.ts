import { NextRequest, NextResponse } from "next/server";
import { clearSession, refreshSession } from "@/lib/session";

function getSafeDestination(value: string | null) {
  if (value?.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/home";
}

export async function GET(request: NextRequest) {
  const destination = getSafeDestination(request.nextUrl.searchParams.get("next"));
  const tokens = await refreshSession();

  if (!tokens) {
    await clearSession();
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.redirect(new URL(destination, request.url));
}
