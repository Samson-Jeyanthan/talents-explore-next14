"use server";

import axios from "axios";
// import { getSession } from "@/lib/session";
import { getUserPersonalInfoAction } from "./auth.action";
import { getAuthHeaders as resolveSessionHeaders } from "@/lib/session";
import {
  chatMessageValidation,
  ChatMessageInput,
} from "@/lib/validations/chat.validation";
import { isRedirectError } from "next/dist/client/components/redirect";

const SUCCESS_STATUS = "7400";

type CurrentChatUser = {
  _id: string;
  isTalent: boolean;
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

type SendChatMessagePayload = ChatMessageInput;

async function getAccessToken() {
  const headers = await resolveSessionHeaders();
  return headers.Authorization.slice("Bearer ".length);
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

function normalizeChatMessagesResponse(responseData: any): any[] {
  const looksLikeMessage = (item: any) =>
    item &&
    typeof item === "object" &&
    (typeof item._id === "string" ||
      typeof item.chatId === "string" ||
      typeof item.content === "string" ||
      typeof item.createdAt === "string");

  const findMessages = (value: any): any[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      if (value.some(looksLikeMessage)) return value;
      for (const item of value) {
        const nested = findMessages(item);
        if (nested.length) return nested;
      }
      return [];
    }

    if (typeof value === "object") {
      for (const key of ["messages", "list", "data", "response"]) {
        const nested = findMessages(value[key]);
        if (nested.length) return nested;
      }
    }
    return [];
  };

  return findMessages(responseData?.response ?? responseData);
}

async function getCurrentUserResponse() {
  const token = await getAccessToken();

  if (!token) {
    return { token: "", user: null };
  }

  try {
    const response = await getUserPersonalInfoAction(token);
    if (response?.status !== SUCCESS_STATUS || !response.response?._id)
      return { token: "", user: null };
    return {
      token,
      user: response?.response || null,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
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
    isTalent: user.isTalent === true,
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
      },
    );

    if (response.data?.status === SUCCESS_STATUS) {
      return {
        oneToOne: Number(response.data?.response?.oneToOne || 0),
        group:
          user.isTalent === true
            ? Number(response.data?.response?.group || 0)
            : 0,
        request: Number(response.data?.response?.request || 0),
      };
    }

    return { oneToOne: 0, group: 0, request: 0 };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("getChatUnreadCountAction failed:", error);
    return { oneToOne: 0, group: 0, request: 0 };
  }
}

export async function getChatRoomsAction(
  type: "chat" | "request" = "chat",
  pageNumber = 1,
  pageSize = 10,
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
      },
    );

    const normalizedRooms = normalizeChatRoomResponse(response.data);

    if (
      response.data?.status === SUCCESS_STATUS ||
      normalizedRooms.length > 0
    ) {
      return normalizedRooms;
    }

    console.error("getChatRoomsAction unexpected response:", response.data);
    return [];
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const axiosError = error as any;
    const normalizedRooms = normalizeChatRoomResponse(
      axiosError?.response?.data,
    );

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

    if (!token || !user?._id || user.isTalent !== true) {
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
      },
    );

    const normalizedRooms = normalizeChatRoomResponse(response.data);

    if (
      response.data?.status === SUCCESS_STATUS ||
      normalizedRooms.length > 0
    ) {
      return normalizedRooms;
    }

    console.error(
      "getGroupChatRoomsAction unexpected response:",
      response.data,
    );
    return [];
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const axiosError = error as any;
    const normalizedRooms = normalizeChatRoomResponse(
      axiosError?.response?.data,
    );

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
      },
    );

    return response.data?.status === SUCCESS_STATUS
      ? response.data?.response
      : null;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("createOneToOneChatAction failed:", error);
    return null;
  }
}

export async function getChatMembersAction(roomId: string) {
  try {
    const { token, user } = await getCurrentUserResponse();

    if (!token || !user?._id || !roomId) {
      return { status: "400", list: [], info: null };
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/members/${roomId}/${user._id}`,
      {
        headers: getAuthHeaders(token),
        timeout: 15000,
      },
    );

    if (
      response.data?.status === SUCCESS_STATUS &&
      Array.isArray(response.data?.response?.list)
    ) {
      const info = response.data.response.info;
      // Classify from the server response, not the caller's ?type=chat hint.
      if (user.isTalent !== true && !["CHAT", "REQUEST"].includes(info?.type))
        return { status: "403", list: [], info: null };
      return {
        status: SUCCESS_STATUS,
        list: Array.isArray(response.data?.response?.list)
          ? response.data.response.list
          : [],
        info: response.data?.response?.info || null,
      };
    }

    return { status: "400", list: [], info: null };
  } catch (error) {
    if (isRedirectError(error)) throw error;

    return { status: "400", list: [], info: null };
  }
}

export async function getGroupChatRoomDetailsAction(roomId: string) {
  try {
    const { token, user } = await getCurrentUserResponse();

    if (!token || !roomId || user?.isTalent !== true) {
      return null;
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/groupChatRoomDetails/${roomId}`,
      {
        headers: getAuthHeaders(token),
        timeout: 15000,
      },
    );

    return response.data?.status === SUCCESS_STATUS
      ? response.data?.response || null
      : null;
  } catch (error) {
    if (isRedirectError(error)) throw error;

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
    if (
      user.isTalent !== true &&
      (await getChatMembersAction(roomId)).status !== SUCCESS_STATUS
    )
      return [];

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
      },
    );

    const messages = normalizeChatMessagesResponse(response.data);
    if (response.data?.status === SUCCESS_STATUS || messages.length > 0) {
      return messages;
    }

    return [];
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("getChatMessagesAction failed:", error);
    return normalizeChatMessagesResponse((error as any)?.response?.data);
  }
}

export async function sendChatMessageAction(payload: SendChatMessagePayload) {
  const parsed = chatMessageValidation.safeParse(payload);
  if (!parsed.success)
    return { status: "ERROR", message: parsed.error.issues[0].message };
  payload = parsed.data;
  try {
    const { token, user } = await getCurrentUserResponse();

    if (!token || !user?._id || !payload.roomId) {
      return {
        status: "ERROR",
        message: "Unable to identify your chat session. Please try again.",
      };
    }

    if (
      user.isTalent !== true &&
      (await getChatMembersAction(payload.roomId)).status !== SUCCESS_STATUS
    )
      return {
        status: "ERROR",
        message: "This conversation is unavailable for your account.",
      };

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
        timeout: 15000,
      },
    );

    if (
      response.status >= 200 &&
      response.status < 300 &&
      response.data?.status === SUCCESS_STATUS
    )
      return response.data;
    return {
      status: "ERROR",
      message:
        typeof response.data?.message === "string"
          ? response.data.message
          : "Unable to send your message. Please try again.",
    };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    const message = error?.response?.data?.message;
    return {
      status: "ERROR",
      message:
        typeof message === "string"
          ? message
          : "Unable to send your message. Please try again.",
    };
  }
}

export async function deleteChatMessageAction(roomId: string, chatId: string) {
  try {
    const { token, user } = await getCurrentUserResponse();

    if (!token || !roomId || !chatId) {
      return false;
    }
    if (
      user?.isTalent !== true &&
      (await getChatMembersAction(roomId)).status !== SUCCESS_STATUS
    )
      return false;

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/deleteMessage`,
      {
        roomId,
        chatId,
      },
      {
        headers: getAuthHeaders(token),
      },
    );

    return response.data;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("deleteChatMessageAction failed:", error);
    return false;
  }
}

export async function deleteConversationAction(roomId: string) {
  try {
    const { token, user } = await getCurrentUserResponse();
    const userId = user?._id;

    if (!token || !userId || !roomId) {
      return false;
    }
    if (
      user.isTalent !== true &&
      (await getChatMembersAction(roomId)).status !== SUCCESS_STATUS
    )
      return false;

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/deleteConversation/${userId}/${roomId}`,
      {},
      {
        headers: getAuthHeaders(token),
      },
    );

    return response.data;
  } catch (error) {
    if (isRedirectError(error)) throw error;
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
      },
    );

    return response.data;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("acceptChatRequestAction failed:", error);
    return false;
  }
}
