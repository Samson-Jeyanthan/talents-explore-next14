"use client";

import { userPersonalInfoAction } from "@/actions/auth.action";
import { verifySession } from "@/lib/session";
import { IContextType, ICurrentUser } from "@/types/auth.types";
import { jwtDecode } from "jwt-decode";
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
  isAuthenticated: false,
  setUser: () => {},
  setIsAuthenticated: () => {},
  checkAuthUser: async () => {},
};

const AuthContext = createContext<IContextType>(INITIAL_STATE);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<ICurrentUser>(INITIAL_USER);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const checkAuthUser = async () => {
    setIsLoading(true);
    const token = await verifySession();
    try {
      if (token) {
        const decodedJWTToken = jwtDecode(token);
        const res = await userPersonalInfoAction(decodedJWTToken?.sub);
        console.log(res, "res");
        if (res.status === "7400") {
          if (res?.response?.personalInfo?.firstName) {
            setUser({
              currentUserId: res?.response?._id,
              firstName: res?.response?.personalInfo?.firstName,
              lastName: res?.response?.personalInfo?.lastName,
              username: res?.response?.userName,
              email: res?.response?.email,
              imageUrl: res?.response?.personalInfo?.profileImage,
              isTalent: res?.response?.isTalent,
            });
            setIsAuthenticated(true);
            setIsLoading(false);
          } else {
            router.push(`/complete-profile/${decodedJWTToken?.sub}`);
            toast.info("Please complete your profile", {
              duration: 5000,
            });
            setIsLoading(false);
          }
        } else {
          toast.error("Couldn't fetch user details", {
            duration: 5000,
          });
          setIsLoading(false);
        }
      }
    } catch {}
  };

  useEffect(() => {
    checkAuthUser();
    console.log("use effect call");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    user,
    setUser,
    isLoading,
    isAuthenticated,
    setIsAuthenticated,
    checkAuthUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

export const useUserContext = () => useContext(AuthContext);
