"use client";

import {
  DialogContent,
  Dialog,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import React, { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ForgotPasswordValidation } from "@/lib/validations/auth.validation";
import { FormInput } from "../inputs";
import { OTPModal, ResetPasswordModal } from ".";
import { useRouter } from "next/navigation";
import { handleForgotPassword } from "@/lib/functions/auth.functions";
import { IsOpenState } from "@/types/auth.types";
import {
  clearOtpSession,
  readOtpSession,
  startOtpSession,
} from "@/lib/utils/otp-session";
import { toast } from "sonner";

const ForgotPassword = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState<IsOpenState>({
    isFP: false,
    isOTP: false,
    isReset: false,
  });
  const [verifiedUserId, setVerifiedUserId] = useState<string>("");
  const [verifiedOtp, setVerifiedOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const request = useRef({ active: true, busy: false });
  const form = useForm<z.infer<typeof ForgotPasswordValidation>>({
    resolver: zodResolver(ForgotPasswordValidation),
    defaultValues: {
      email: "",
    },
  });

  // open FP | OTP modal at component did mount
  useEffect(() => {
    const current = request.current;
    current.active = true;
    const pending = readOtpSession("password");
    if (pending) setPendingEmail(pending.identifier);
    setIsOpen({ isFP: !pending, isOTP: !!pending, isReset: false });
    return () => {
      current.active = false;
    };
  }, []);

  async function onSubmit(values: z.infer<typeof ForgotPasswordValidation>) {
    if (request.current.busy) return;
    request.current.busy = true;
    setVerifiedUserId("");
    setVerifiedOtp("");
    const email = values.email;
    setError(null);
    try {
      const response = await handleForgotPassword(email);
      if (!request.current.active) return;
      if (response) {
        startOtpSession("password", email);
        setPendingEmail(email);
        setIsOpen({ isFP: false, isOTP: true, isReset: false });
        toast.success("A verification code has been sent.");
      } else setError("Unable to send a code. Check your email and try again.");
    } catch {
      if (request.current.active)
        setError("Unable to send a code right now. Please try again.");
    } finally {
      request.current.busy = false;
    }
  }

  const handleCancel = async () => {
    if (request.current.busy) return;
    clearOtpSession("password");
    router.push("/sign-in");
  };

  return (
    <>
      {isOpen.isFP && (
        <Dialog open={isOpen.isFP}>
          <DialogContent className="flex max-w-96 flex-col items-center gap-3 rounded-xl border-none bg-dark-250 p-5">
            <DialogTitle className="h1-bold text-light-900">
              Forgot Password?
            </DialogTitle>
            <DialogDescription className="text-justify text-[12px] text-light-900">
              Simply enter your email address below, and we&rsquo;ll send you an
              OTP code to reset your password securely via email.
            </DialogDescription>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex-center mt-4 w-full flex-col gap-2"
              >
                <FormInput
                  form={form}
                  inputName="email"
                  inputType="email"
                  placeholder="Email"
                />

                {error && (
                  <p className="font-regular mt-3 text-custom-100">{error}</p>
                )}
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="shad-button_primary mt-4 w-full"
                >
                  Submit
                </Button>
              </form>
            </Form>
            <button
              type="button"
              disabled={form.formState.isSubmitting}
              className="my-4 mb-2 text-light-600 hover:text-light-900 disabled:opacity-50"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </DialogContent>
        </Dialog>
      )}

      {isOpen.isOTP ? (
        <Dialog open={isOpen.isOTP}>
          <OTPModal
            userId=""
            email={pendingEmail}
            isSignup={false}
            setIsOpen={setIsOpen}
            setVerifiedUserId={setVerifiedUserId}
            setVerifiedOtp={setVerifiedOtp}
          />
        </Dialog>
      ) : null}

      {isOpen.isReset ? (
        <Dialog open={isOpen.isReset}>
          <ResetPasswordModal
            verifiedUserId={verifiedUserId}
            verifiedOtp={verifiedOtp}
          />
        </Dialog>
      ) : null}
    </>
  );
};

export default ForgotPassword;
