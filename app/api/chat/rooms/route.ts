import { getUserPersonalInfoAction } from "@/actions/auth.action";
import { getAuthHeaders as resolveSessionHeaders } from "@/lib/session";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
}

function normalizeChatRoomResponse(responseData: any) {
  const looksLikeRoom = (item: any) =>
    item &&
    typeof item === "object" &&
    (typeof item.roomId === "string" ||
      typeof item._id === "string" ||
      Array.isArray(item.member) ||
      !!item.collaboration);

  const findNestedRoomArray = (value: any): any[] => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      if (value.some(looksLikeRoom)) {
        return value;
      }

      for (const entry of value) {
        const nested = findNestedRoomArray(entry);
        if (nested.length > 0) {
          return nested;
        }
      }

      return [];
    }

    if (typeof value === "object") {
      const objectValues = Object.values(value);

      if (objectValues.length > 0 && objectValues.some(looksLikeRoom)) {
        return objectValues;
      }

      for (const nestedValue of objectValues) {
        const nested = findNestedRoomArray(nestedValue);
        if (nested.length > 0) {
          return nested;
        }
      }
    }

    return [];
  };

  if (Array.isArray(responseData?.response)) {
    return responseData.response;
  }

  if (Array.isArray(responseData?.response?.list)) {
    return responseData.response.list;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData)) {
    return responseData;
  }

  return findNestedRoomArray(responseData);
}

async function getCurrentUserResponse() {
  const sessionHeaders = await resolveSessionHeaders();
  const token = sessionHeaders.Authorization.slice("Bearer ".length);

  if (!token) {
    return { token: "", user: null };
  }

  try {
    const response = await getUserPersonalInfoAction(token);
    if (response?.status !== "7400") return { token: "", user: null };
    return {
      token,
      user: response?.response || null,
    };
  } catch (error) {
    console.error("chat rooms route current user failed:", error);
    return { token: "", user: null };
  }
}

export async function GET(request: NextRequest) {
  let viewerId: string | null = null;
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "chat";
    const pageNumber = Number(searchParams.get("pageNumber") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 10);

    const { token, user } = await getCurrentUserResponse();

    if (!token || !user?._id)
      return chatResponse({ viewerId: null, rooms: [] }, { status: 401 });
    viewerId = user._id;
    const expectedViewer = searchParams.get("viewerId");
    if (expectedViewer && expectedViewer !== viewerId)
      return chatResponse(
        { viewerId, rooms: [], message: "Your account changed." },
        { status: 409 },
      );

    const isGroup = tab === "group";
    if (isGroup && user.isTalent !== true)
      return chatResponse(
        { viewerId, rooms: [], message: "Become a talent to use group chats." },
        { status: 403 },
      );
    if (
      !["chat", "request", "group"].includes(tab) ||
      !Number.isSafeInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    )
      return chatResponse({ viewerId, rooms: [] }, { status: 400 });
    const url = isGroup
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/group/getChatRooms/${user._id}`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/getChatRooms/${user._id}/${tab.toUpperCase()}`;

    const response = await axios.get(url, {
      headers: getAuthHeaders(token),
      params: {
        userId: user._id,
        pageNumber,
        pageSize,
      },
      timeout: 15000,
    });

    if (response.data?.status !== "7400")
      return chatResponse({ viewerId, rooms: [] }, { status: 502 });
    return chatResponse({
      viewerId,
      rooms: normalizeChatRoomResponse(response.data),
    });
  } catch {
    return chatResponse(
      { viewerId, rooms: [], message: "Unable to load conversations." },
      { status: 503 },
    );
  }
}

function chatResponse(body: unknown, options: { status?: number } = {}) {
  return NextResponse.json(body, {
    ...options,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Vary: "Cookie",
    },
  });
}
