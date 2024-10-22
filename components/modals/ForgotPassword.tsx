"use client";

import { cn } from "@/lib/utils";
import {
  DialogContent,
  DialogOverlay,
  Dialog,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ForgotPasswordValidation } from "@/lib/validations/auth.validation";
import { FormInput } from "../inputs";
import { OTPModal, ResetPasswordModal } from ".";
import { useRouter } from "next/navigation";
import {
  handleForgotPassword,
  handleClearStorage,
} from "@/lib/functions/auth.functions";
import { IsOpenState } from "@/types/auth.types";

const ForgotPassword = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState<IsOpenState>({
    isFP: false,
    isOTP: false,
    isReset: false,
  });
  const [verifiedUserId, setVerifiedUserId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof ForgotPasswordValidation>>({
    resolver: zodResolver(ForgotPasswordValidation),
    defaultValues: {
      email: "",
    },
  });

  // open FP | OTP modal at component did mount
  useEffect(() => {
    const checkExistingCountDown =
      localStorage.getItem("countdown") !== "00:00";
    const checkOTPOpen = localStorage.getItem("isOTP") === "true";

    if (checkExistingCountDown && checkOTPOpen) {
      if (!isOpen.isFP && !isOpen.isOTP && !isOpen.isReset) {
        setIsOpen({
          ...isOpen,
          isOTP: true,
        });
      }
    } else {
      handleClearStorage();
      setIsOpen({
        ...isOpen,
        isFP: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: z.infer<typeof ForgotPasswordValidation>) {
    const email = values.email;
    const response = await handleForgotPassword(email, {
      userId: "",
      setError,
      setIsOpen,
    });
    if (response) {
      localStorage.setItem("verifiedEmail", email);
    }
  }

  const handleCancel = async () => {
    await handleClearStorage();
    router.push("/sign-in");
  };

  return (
    <>
      {isOpen.isFP && (
        <Dialog open={isOpen.isFP}>
          <DialogOverlay className={cn("bg-black/10 backdrop-blur-sm")} />
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
            <p
              className="font-regular my-4 mb-2 cursor-pointer text-light-600 hover:text-light-900"
              onClick={handleCancel}
            >
              Cancel
            </p>
          </DialogContent>
        </Dialog>
      )}

      {isOpen.isOTP ? (
        <Dialog open={isOpen.isOTP}>
          <OTPModal
            userId=""
            isSignup={false}
            setIsOpen={setIsOpen}
            setVerifiedUserId={setVerifiedUserId}
          />
        </Dialog>
      ) : null}

      {isOpen.isReset ? (
        <Dialog open={isOpen.isReset}>
          <ResetPasswordModal verifiedUserId={verifiedUserId} />
        </Dialog>
      ) : null}
    </>
  );
};

export default ForgotPassword;
