import {
  forgotPasswordAction,
  otpVerificationAction,
  resendOtpAction,
  resetPasswordAction,
  signinAction,
  verifyForgotPasswordAction,
} from "@/actions/auth.action";
// import { setIsAuthenticated } from "@/redux/slices/authSlice";
import { AppDispatch } from "@/redux/store";
import {
  TOTPProps,
  TResetPasswordProps,
  TSigninProps,
  TVerifyForgotPasswordOtpProps,
  TVerifyOTPProps,
} from "@/types/auth.types";
import { toast } from "sonner";

// note - sign-in function
export async function handleSignIn(formData: TSigninProps, dispatch : AppDispatch) {
  const res = await signinAction(formData);
  console.log(res);
  if (res?.status === "7400") {
    toast.success("Sign In Successfully");
    // dispatch(setIsAuthenticated())
      // const dispatch = useDispatch<AppDispatch>();
      // const mode = useAppSelector((state: any) => state.utilsReducer.mode);
      // dispatch(setMode("dark"));
    return true;
  } else {
    toast.error("Sign In Failed");
  }
}

// note - signup otp function
export async function handleVerifyEmailOtp(formData: TVerifyOTPProps) {
  const res = await otpVerificationAction(formData);
  console.log(res);
  if (res?.status === "7400") {
    toast.success("Credentials Verified");
    return true;
  } else {
    toast.error("OTP Verification Failed");
  }
}

// note - signup otp resend function
export async function handleResendOtp(userId: string) {
  const res = await resendOtpAction(userId);
  console.log(res);
  if (res?.status === "7400") {
    toast.success("OTP Has Send to Your Email", { duration: 4000 });
  } else {
    toast.error("Couldn't Find Your Email Address", {
      duration: 4000,
    });
  }
}

export async function handleForgotPassword(
  email: string,
  { setError, setIsOpen }: TOTPProps
) {
  const res = await forgotPasswordAction(email);
  console.log(res);
  if (res?.status === "7400") {
    localStorage.setItem("isOTP", "true");
    if (setIsOpen) {
      setIsOpen((prevState: any) => ({
        ...prevState,
        isFP: false,
        isOTP: true,
      }));
    }
    toast.success("OTP Has Send to Your Email", { duration: 4000 });
    return true;
  } else {
    toast.error("Couldn't Find Your Email Address", {
      duration: 4000,
    });
    if (setError) {
      setError("Invalid Email Address");
    }
    return false;
  }
}

// note - otp verification for forgot password
export async function handleVerifyForgotPasswordOtp(
  formData: TVerifyForgotPasswordOtpProps,
  { setIsOpen }: TOTPProps
) {
  const res = await verifyForgotPasswordAction(formData);
  console.log(res);
  if (res?.status === "7400") {
    toast.success("Credentials Verified");
    if (setIsOpen) {
      setIsOpen((prevState: any) => ({
        ...prevState,
        isOTP: false,
        isReset: true,
      }));
    }
    localStorage.removeItem("countdown");
    localStorage.removeItem("isOTP");
    return res?.response;
  } else {
    toast.error("OTP Verification Failed");
    // this is temp otp fail action
    if (setIsOpen) {
      setIsOpen((prevState) => ({
        ...prevState,
        isOTP: true,
      }));
    }
  }
}

// note - resend otp for forgot password
export async function handleResendFPOtp(email: string | undefined) {
  const res = await forgotPasswordAction(email);
  console.log(res);
  if (res?.status === "7400") {
    toast.success("OTP Has Resend to Your Email", { duration: 4000 });
  } else {
    toast.error("Couldn't Send OTP", {
      duration: 4000,
    });
  }
}

export async function handleResetPassword(formData: TResetPasswordProps) {
  const res = await resetPasswordAction(formData);
  console.log(res);
  if (res?.status === "7400") {
    toast.success("Password Reset Successful", { duration: 5000 });
    return true;
  } else {
    toast.error("Password Reset Failed", { duration: 5000 });
    return false;
  }
}
