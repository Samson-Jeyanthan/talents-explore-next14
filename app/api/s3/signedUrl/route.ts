import { NextRequest, NextResponse } from "next/server";
import { refreshSession } from "@/lib/session";
import { clearSession, getSession } from "@/actions/session.action";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

async function requestSignedUrl(payload: unknown, accessToken: string) {
  return fetch(`${backendUrl}/s3/signedUrl`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
}

export async function POST(request: NextRequest) {
  if (!backendUrl) {
    return NextResponse.json(
      { message: "Backend URL is not configured." },
      { status: 500 }
    );
  }

  let payload: { fileName?: unknown; contentType?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid upload request." },
      { status: 400 }
    );
  }

  if (
    typeof payload.fileName !== "string" ||
    typeof payload.contentType !== "string"
  ) {
    return NextResponse.json(
      { message: "A file name and content type are required." },
      { status: 400 }
    );
  }

  const accessToken = await getSession();
  if (!accessToken) {
    await clearSession();
    return NextResponse.json(
      { message: "Your session has expired." },
      { status: 401 }
    );
  }

  let upstream = await requestSignedUrl(payload, accessToken);
  if (upstream.status === 401) {
    const refreshed = await refreshSession();
    if (!refreshed.ok) {
      await clearSession();
      return NextResponse.json(
        { message: "Your session has expired." },
        { status: 401 }
      );
    }
    upstream = await requestSignedUrl(payload, refreshed.accessToken);
  }

  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") || "application/json",
    },
  });
}
