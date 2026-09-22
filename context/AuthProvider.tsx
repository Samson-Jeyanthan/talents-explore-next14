"use client";

import { getUserPersonalInfoAction } from "@/actions/auth.action";
import { getSession } from "@/lib/session";
import { IContextType, ICurrentUser } from "@/types/auth.types";
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useGlobalLoading } from "@/context/LoadingProvider";

export const AUTH_USER_CACHE_KEY = "talents-explore-auth-user";

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
  const [user, setUser] = useState<ICurrentUser>(INITIAL_USER);
  const [isLoading, setIsLoading] = useState(false);
  const authCheckStarted = useRef(false);
  const { beginLoading } = useGlobalLoading();

  async function checkAuthUser() {
    if (typeof window !== "undefined") {
      const cachedUser = sessionStorage.getItem(AUTH_USER_CACHE_KEY);
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
          return;
        } catch {
          sessionStorage.removeItem(AUTH_USER_CACHE_KEY);
        }
      }
    }

    setIsLoading(true);
    const finishLoading = beginLoading("Loading your account...");
    let token = "";
    try {
      token = await getSession();
    } catch (error) {
      console.error("Error reading auth session:", error);
      setIsLoading(false);
      finishLoading();
      return;
    }

    if (!token) {
      setIsLoading(false);
      finishLoading();
      return;
    }

    try {
      const res = await getUserPersonalInfoAction(token);

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
          setUser(nextUser);
          sessionStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(nextUser));
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
          setUser(nextUser);
          sessionStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(nextUser));
          // router.push("/complete-profile");
          toast.info("Please complete your profile", {
            duration: 5000,
          });
        }
      } else {
        // router.push("/sign-in");
        toast.error("Couldn't fetch user details", {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error checking auth user:", error);
      toast.error("Error checking auth user", {
        duration: 5000,
      });
      throw error;
    } finally {
      setIsLoading(false);
      finishLoading();
    }
  }

  useEffect(() => {
    if (authCheckStarted.current) return;
    authCheckStarted.current = true;
    checkAuthUser();
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
