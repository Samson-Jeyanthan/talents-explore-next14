"use server";

import axios from "axios";
import { getSession } from "@/lib/session";
import { userPersonalInfoAction } from "./auth.action";

const SUCCESS_STATUS = "7400";

type CurrentChatUser = {
  _id: string;
  userName: string;
  profileImage: string | null;
  professional: string;
};

type ChatUnreadCount = {
  oneToOne: number;
  group: number;
  request: number;
};

type ChatMessagesParams = {
  roomId: string;
  id?: string | null;
  direction?: "up" | "down";
  pageSize?: number;
};

type SendChatMessagePayload = {
  roomId: string;
  content?: string | null;
  colorCode?: string | null;
  mediaType?: "image" | "video" | "link" | "gif" | null;
  media?: string | null;
  url?: string | null;
  videoThumbnail?: string | null;
};

async function getAccessToken() {
  return await getSession();
}

function getAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function normalizeChatRoomResponse(responseData: any) {
  const looksLikeRoom = (item: any) =>
    item &&
    typeof item === "object" &&
    (typeof item.roomId === "string" ||
      typeof item._id === "string" ||
      Array.isArray(item.member));

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
      for (const nestedValue of Object.values(value)) {
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
  const token = await getAccessToken();

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
    console.error("getCurrentUserResponse failed:", error);
    return { token: "", user: null };
  }
}

async function getCurrentUserId() {
  const { user } = await getCurrentUserResponse();
  return user?._id || "";
}

export async function getCurrentChatUserAction(): Promise<CurrentChatUser | null> {
  const { user } = await getCurrentUserResponse();

  if (!user?._id) {
    return null;
  }

  return {
    _id: user._id,
    userName: user.userName || "",
    profileImage: user?.personalInfo?.profileImage || null,
    professional: user?.personalInfo?.professional || "",
  };
}

export async function getChatUnreadCountAction(): Promise<ChatUnreadCount> {
  try {
    const { token, user } = await getCurrentUserResponse();

    if (!token || !user?._id) {
      return { oneToOne: 0, group: 0, request: 0 };
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/unreadTabCount/${user._id}`,
      {
        headers: getAuthHeaders(token),
      }
    );

    if (response.data?.status === SUCCESS_STATUS) {
      return {
        oneToOne: Number(response.data?.response?.oneToOne || 0),
        group: Number(response.data?.response?.group || 0),
        request: Number(response.data?.response?.request || 0),
      };
    }

    return { oneToOne: 0, group: 0, request: 0 };
  } catch (error) {
    console.error("getChatUnreadCountAction failed:", error);
    return { oneToOne: 0, group: 0, request: 0 };
  }
}

export async function getChatRoomsAction(
  type: "chat" | "request" = "chat",
  pageNumber = 1,
  pageSize = 10
) {
  try {
    const { token, user } = await getCurrentUserResponse();

    if (!token || !user?._id) {
      return [];
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/getChatRooms/${user._id}/${type.toUpperCase()}`,
      {
        headers: getAuthHeaders(token),
        params: {
          userId: user._id,
          pageNumber,
          pageNo: pageNumber,
          pageSize,
        },
      }
    );

    const normalizedRooms = normalizeChatRoomResponse(response.data);

    if (response.data?.status === SUCCESS_STATUS || normalizedRooms.length > 0) {
      return normalizedRooms;
    }

    console.error("getChatRoomsAction unexpected response:", response.data);
    return [];
  } catch (error) {
    const axiosError = error as any;
    const normalizedRooms = normalizeChatRoomResponse(axiosError?.response?.data);

    if (normalizedRooms.length > 0) {
      return normalizedRooms;
    }

    console.error("getChatRoomsAction failed:", error);
    return [];
  }
}

export async function getGroupChatRoomsAction(pageNumber = 1, pageSize = 10) {
  try {
    const { token, user } = await getCurrentUserResponse();

    if (!token || !user?._id) {
      return [];
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/group/getChatRooms/${user._id}`,
      {
        headers: getAuthHeaders(token),
        params: {
          userId: user._id,
          pageNumber,
          pageNo: pageNumber,
          pageSize,
        },
      }
    );

    const normalizedRooms = normalizeChatRoomResponse(response.data);

    if (response.data?.status === SUCCESS_STATUS || normalizedRooms.length > 0) {
      return normalizedRooms;
    }

    console.error("getGroupChatRoomsAction unexpected response:", response.data);
    return [];
  } catch (error) {
    const axiosError = error as any;
    const normalizedRooms = normalizeChatRoomResponse(axiosError?.response?.data);

    if (normalizedRooms.length > 0) {
      return normalizedRooms;
    }

    console.error("getGroupChatRoomsAction failed:", error);
    return [];
  }
}

export async function createOneToOneChatAction(userIdB: string) {
  try {
    const { token, user } = await getCurrentUserResponse();

    if (!token || !user?._id || !userIdB) {
      return null;
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/oneToOneChat`,
      {
        userIdA: user._id,
        userIdB,
      },
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data?.status === SUCCESS_STATUS ? response.data?.response : null;
  } catch (error) {
    console.error("createOneToOneChatAction failed:", error);
    return null;
  }
}

export async function getChatMembersAction(roomId: string) {
  try {
    const { token, user } = await getCurrentUserResponse();

    if (!token || !user?._id || !roomId) {
      return { list: [], info: null };
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/members/${roomId}/${user._id}`,
      {
        headers: getAuthHeaders(token),
      }
    );

    if (response.data?.status === SUCCESS_STATUS) {
      return {
        list: Array.isArray(response.data?.response?.list)
          ? response.data.response.list
          : [],
        info: response.data?.response?.info || null,
      };
    }

    return { list: [], info: null };
  } catch (error) {
    console.error("getChatMembersAction failed:", error);
    return { list: [], info: null };
  }
}

export async function getGroupChatRoomDetailsAction(roomId: string) {
  try {
    const token = await getAccessToken();

    if (!token || !roomId) {
      return null;
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/groupChatRoomDetails/${roomId}`,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data?.status === SUCCESS_STATUS
      ? response.data?.response || null
      : null;
  } catch (error) {
    console.error("getGroupChatRoomDetailsAction failed:", error);
    return null;
  }
}

export async function getChatMessagesAction({
  roomId,
  id = null,
  direction = "down",
  pageSize = 10,
}: ChatMessagesParams) {
  try {
    const { token, user } = await getCurrentUserResponse();

    if (!token || !user?._id || !roomId) {
      return [];
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/getMessages`,
      {
        headers: getAuthHeaders(token),
        params: {
          roomId,
          direction,
          pageSize,
          id,
          userId: user._id,
        },
      }
    );

    if (response.data?.status === SUCCESS_STATUS) {
      return Array.isArray(response.data?.response) ? response.data.response : [];
    }

    return [];
  } catch (error) {
    console.error("getChatMessagesAction failed:", error);
    return [];
  }
}

export async function sendChatMessageAction(payload: SendChatMessagePayload) {
  try {
    const { token, user } = await getCurrentUserResponse();

    if (!token || !user?._id || !payload.roomId) {
      return false;
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/sendMessage`,
      {
        roomId: payload.roomId,
        userId: user._id,
        userName: user.userName,
        colorCode: payload.colorCode ?? null,
        userProfilePicture: user?.personalInfo?.profileImage || null,
        mediaType: payload.mediaType ?? null,
        videoThumbnail: payload.videoThumbnail ?? null,
        content: payload.content || null,
        media: payload.media ?? null,
        url: payload.url ?? null,
      },
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("sendChatMessageAction failed:", error);
    return false;
  }
}

export async function deleteChatMessageAction(roomId: string, chatId: string) {
  try {
    const token = await getAccessToken();

    if (!token || !roomId || !chatId) {
      return false;
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/deleteMessage`,
      {
        roomId,
        chatId,
      },
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("deleteChatMessageAction failed:", error);
    return false;
  }
}

export async function deleteConversationAction(roomId: string) {
  try {
    const token = await getAccessToken();
    const userId = await getCurrentUserId();

    if (!token || !userId || !roomId) {
      return false;
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/deleteConversation/${userId}/${roomId}`,
      {},
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("deleteConversationAction failed:", error);
    return false;
  }
}

export async function acceptChatRequestAction(requestId: string) {
  try {
    const token = await getAccessToken();
    const userId = await getCurrentUserId();

    if (!token || !userId || !requestId) {
      return false;
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/acceptRequest/${userId}/${requestId}`,
      {},
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("acceptChatRequestAction failed:", error);
    return false;
  }
}
