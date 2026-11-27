"use client";

import { getCurrentSessionUserAction } from "@/actions/session.action";
import { IContextType, ICurrentUser } from "@/types/auth.types";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { toast } from "sonner";
import {
  readCachedAuthUser,
  writeCachedAuthUser,
  clearCachedAuthUser,
  AUTH_SESSION_CHANGE_KEY,
} from "@/lib/utils/auth-user-cache";

export { AUTH_USER_CACHE_KEY } from "@/lib/utils/auth-user-cache";

export const INITIAL_USER = {
  currentUserId: "",
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  imageUrl: null,
  isTalent: false,
};

const INITIAL_STATE = {
  user: INITIAL_USER,
  isLoading: false,
  setUser: () => {},
  checkAuthUser: async () => {},
};

const AuthContext = createContext<IContextType>(INITIAL_STATE);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<ICurrentUser>(INITIAL_USER);
  const [isLoading, setIsLoading] = useState(false);
  const authVersion = useRef(0);
  const currentUser = useRef(user);
  currentUser.current = user;
  const setUser: React.Dispatch<React.SetStateAction<ICurrentUser>> = (
    value,
  ) => {
    authVersion.current++;
    setIsLoading(false);
    setUserState(value);
  };

  async function checkAuthUser(force = false) {
    const version = ++authVersion.current;
    const cachedUser = force ? null : readCachedAuthUser();
    if (cachedUser) {
      setIsLoading(false);
      setUserState(cachedUser);
      return;
    }

    setIsLoading(true);
    try {
      const res = await getCurrentSessionUserAction();
      if (version !== authVersion.current) return;
      if (res?.status === "7400" && !res.response?._id)
        throw new Error("Unable to verify your account. Please try again.");
      if (
        !res ||
        (res.status === "7400" &&
          currentUser.current.currentUserId &&
          currentUser.current.currentUserId !== res.response?._id)
      ) {
        clearCachedAuthUser();
        setUserState(INITIAL_USER);
        if (force) window.location.assign(res ? "/home" : "/sign-in");
        return;
      }

      if (res.status === "7400") {
        if (res?.response?.personalInfo?.firstName) {
          const nextUser = {
            currentUserId: res?.response?._id || "",
            firstName: res?.response?.personalInfo?.firstName,
            lastName: res?.response?.personalInfo?.lastName,
            username: res?.response?.userName,
            email: res?.response?.email,
            imageUrl: res?.response?.personalInfo?.profileImage,
            isTalent: res?.response?.isTalent,
          };
          setUserState(nextUser);
          writeCachedAuthUser(nextUser);
        } else {
          const nextUser = {
            currentUserId: res?.response?._id || "",
            firstName: "",
            lastName: "",
            username: res?.response?.userName,
            email: res?.response?.email,
            imageUrl: null,
            isTalent: false,
          };
          setUserState(nextUser);
          writeCachedAuthUser(nextUser);
          // router.push("/complete-profile");
          toast.info("Please complete your profile", {
            duration: 5000,
          });
        }
      } else {
        // router.push("/sign-in");
        if (!force)
          toast.error("Couldn't fetch user details", {
            duration: 5000,
          });
      }
    } catch (error) {
      if (version !== authVersion.current) return;
      if (!force)
        toast.error("Error checking auth user", {
          duration: 5000,
        });
      throw error;
    } finally {
      if (version === authVersion.current) setIsLoading(false);
    }
  }

  useEffect(() => {
    const lifecycle = authVersion;
    checkAuthUser().catch(() => {});
    const onSessionChange = (event: StorageEvent) => {
      if (event.key !== AUTH_SESSION_CHANGE_KEY) return;
      authVersion.current++;
      clearCachedAuthUser();
      setUserState(INITIAL_USER);
      window.location.assign("/home");
    };
    const onFocus = () => {
      if (!currentUser.current.currentUserId) return;
      checkAuthUser(true).catch(() => {});
    };
    window.addEventListener?.("storage", onSessionChange);
    window.addEventListener?.("focus", onFocus);
    return () => {
      lifecycle.current++;
      window.removeEventListener?.("storage", onSessionChange);
      window.removeEventListener?.("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    user,
    setUser,
    isLoading,
    checkAuthUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

export const useUserContext = () => useContext(AuthContext);
