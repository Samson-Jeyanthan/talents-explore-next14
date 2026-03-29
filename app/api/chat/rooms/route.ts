import { getSession } from "@/lib/session";
import { userPersonalInfoAction } from "@/actions/auth.action";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

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
  const token = await getSession();

  if (!token) {
    return { token: "", user: null };
  }

  try {
    const response = await userPersonalInfoAction(token);
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
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "chat";
    const pageNumber = Number(searchParams.get("pageNumber") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 10);

    const { token, user } = await getCurrentUserResponse();

    if (!token || !user?._id) {
      return NextResponse.json({
        rooms: [],
        debug: { tab, reason: "no-session" },
      });
    }

    const isGroup = tab === "group";
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
    });

    const rooms = normalizeChatRoomResponse(response.data);

    return NextResponse.json({
      rooms,
      debug: {
        tab,
        status: response.data?.status || null,
        message: response.data?.message || null,
        normalizedCount: rooms.length,
        responseType: Array.isArray(response.data?.response)
          ? "array"
          : typeof response.data?.response,
      },
    });
  } catch (error: any) {
    const raw = error?.response?.data;
    const rooms = normalizeChatRoomResponse(raw);

    return NextResponse.json({
      rooms,
      debug: {
        tab: request.nextUrl.searchParams.get("tab") || "chat",
        status: raw?.status || error?.response?.status || null,
        message: raw?.message || error?.message || "Unknown error",
        normalizedCount: rooms.length,
        responseType: Array.isArray(raw?.response) ? "array" : typeof raw?.response,
      },
    });
  }
}
