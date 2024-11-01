"use client";

import { checkForToken, userPersonalInfoAction } from "@/actions/auth.action";
import { IContextType, ICurrentUser } from "@/types/auth.types";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

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
  const router = useRouter();

  async function checkAuthUser() {
    setIsLoading(true);
    const token = await checkForToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await userPersonalInfoAction(token);

      if (res.status === "7400") {
        if (res?.response?.personalInfo?.firstName) {
          setUser({
            currentUserId: token,
            firstName: res?.response?.personalInfo?.firstName,
            lastName: res?.response?.personalInfo?.lastName,
            username: res?.response?.userName,
            email: res?.response?.email,
            imageUrl: res?.response?.personalInfo?.profileImage,
            isTalent: res?.response?.isTalent,
          });
        } else {
          setUser({
            currentUserId: token,
            firstName: "",
            lastName: "",
            username: res?.response?.userName,
            email: res?.response?.email,
            imageUrl: null,
            isTalent: false,
          });
          // router.push("/complete-profile");
          toast.info("Please complete your profile", {
            duration: 5000,
          });
        }
      } else {
        router.push("/sign-in");
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
    }
  }

  useEffect(() => {
    checkAuthUser();
    console.log("use effect call");
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
