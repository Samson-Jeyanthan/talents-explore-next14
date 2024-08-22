import { Metadata } from "next";
import Signin from "../sign-in/page";
import { ForgotPasswordModal } from "@/components/modals";

export const metadata: Metadata = {
  title: "Forgot Password | Talents Explore",
  description:
    "Forgot your password? Enter your email and we'll send you an OTP code to reset your password securely via email.",
};

const ForgotPassword = () => {
  return (
    <div className="flex-center w-full text-light-900">
      {/* this signin component is for background purpose of FP */}
      <Signin />
      <ForgotPasswordModal />
    </div>
  );
};

export default ForgotPassword;
