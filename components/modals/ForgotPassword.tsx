"use client";

import { cn } from "@/lib/utils";
import { DialogContent, DialogOverlay, Dialog } from "../ui/dialog";
import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ForgotPasswordValidation } from "@/lib/validation/authValidation";
import { FormInput } from "../inputs";
import { OTPModal, ResetPasswordModal } from ".";
import { useRouter } from "next/navigation";
import { handleForgotPassword } from "@/lib/functions/auth.functions";

const ForgotPassword = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState({
    isFP: false,
    isOTP: false,
    isReset: false,
  });
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [verifiedUserId, setVerifiedUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof ForgotPasswordValidation>>({
    resolver: zodResolver(ForgotPasswordValidation),
    defaultValues: {
      email: "",
    },
  });

  const handleCancel = () => {
    localStorage.removeItem("countdown");
    localStorage.removeItem("isOTP");
    router.push("/sign-in");
  };

  // open forgot password modal at component did mount
  useEffect(() => {
    if (!isOpen.isFP && !isOpen.isOTP && !isOpen.isReset) {
      localStorage.removeItem("countdown");
      localStorage.removeItem("isOTP");
      setIsOpen({
        ...isOpen,
        isFP: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: z.infer<typeof ForgotPasswordValidation>) {
    // setIsSubmitting(true);
    const email = values.email;
    const response = await handleForgotPassword(email, { setError, setIsOpen });
    if (response) {
      setVerifiedEmail(email);
    }
  }

  return (
    <>
      {isOpen.isFP && (
        <Dialog open={isOpen.isFP}>
          <DialogOverlay className={cn("bg-black/10 backdrop-blur-sm")} />
          <DialogContent className="flex max-w-96 flex-col items-center gap-3 border-none bg-dark-250 p-5">
            <h1 className="h1-bold text-light-900">Forgot Password?</h1>
            <p className="text-justify text-[12px] text-light-900">
              Simply enter your email address below, and we&rsquo;ll send you an
              OTP code to reset your password securely via email.
            </p>
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
                  // disabled={isSubmitting}
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
            isSignup={false}
            setIsOpen={setIsOpen}
            verifiedEmail={verifiedEmail}
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
