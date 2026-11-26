"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogTitle,
} from "../ui/dialog";
import { cn } from "@/lib/utils";
import { ResetPasswordValidation } from "@/lib/validations/auth.validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "../ui/form";
import { FormInput } from "../inputs";
import { resetPasswordAction } from "@/actions/auth.action";
import { toast } from "sonner";
import { clearOtpSession } from "@/lib/utils/otp-session";

const ResetPassword = ({
  verifiedUserId,
  verifiedOtp,
}: {
  verifiedUserId: string | undefined;
  verifiedOtp: string;
}) => {
  const router = useRouter();
  const request = useRef({ active: true, busy: false, version: 0 });
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const current = request.current;
    current.active = true;
    current.version++;
    return () => {
      current.active = false;
      current.version++;
    };
  }, []);
  const form = useForm<z.infer<typeof ResetPasswordValidation>>({
    resolver: zodResolver(ResetPasswordValidation),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof ResetPasswordValidation>) {
    if (request.current.busy) return;
    request.current.busy = true;
    setPending(true);
    const version = request.current.version;
    const isCurrent = () =>
      request.current.active && request.current.version === version;
    let leaving = false;
    const formData = {
      userId: verifiedUserId,
      otp: verifiedOtp,
      newPassword: values.password,
    };
    try {
      const res = await resetPasswordAction(formData);
      if (!isCurrent()) return;
      if (res.status === true) {
        clearOtpSession("password");
        router.push("/sign-in");
        leaving = true;
        toast.success("Password has reset successfully", { duration: 5000 });
      } else {
        toast.error(res.message, { duration: 5000 });
      }
    } catch {
      if (isCurrent())
        toast.error("Unable to reset your password. Please try again.", {
          duration: 5000,
        });
    } finally {
      if (isCurrent() && !leaving) {
        request.current.busy = false;
        setPending(false);
      }
    }
  }

  const handleCancel = () => {
    if (request.current.busy) return;
    // Keep the form locked until navigation unmounts it.
    request.current.busy = true;
    setPending(true);
    clearOtpSession("password");
    router.push("/sign-in");
  };

  return (
    <>
      <DialogOverlay className={cn("bg-black/10 backdrop-blur-sm")} />
      <DialogContent
        className="flex max-w-96 flex-col items-center gap-3 rounded-xl border-none bg-dark-250 p-5"
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          handleCancel();
        }}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogTitle className="h1-bold text-light-900">
          Reset Password
        </DialogTitle>
        <DialogDescription className="text-justify text-[12px] text-light-900">
          Enter your new password and confirm it to update your account
          credentials. Please do not refresh the page.
        </DialogDescription>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            aria-busy={pending}
            className="mt-4 flex w-full flex-col items-center gap-5"
          >
            <fieldset
              disabled={pending}
              className="flex w-full flex-col items-center gap-5"
            >
              <FormInput
                form={form}
                inputName="password"
                inputType="password"
                placeholder="New Password"
              />
              <FormInput
                form={form}
                inputName="confirmPassword"
                inputType="password"
                placeholder="Confirm Password"
              />
              <Button
                type="submit"
                className="shad-button_primary w-full"
                disabled={pending || form.formState.isSubmitting}
              >
                {pending ? "Submitting..." : "Submit"}
              </Button>
              <button
                type="button"
                disabled={pending || form.formState.isSubmitting}
                className="font-regular my-3 text-light-700 hover:text-light-900 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </fieldset>
          </form>
        </Form>
      </DialogContent>
    </>
  );
};

export default ResetPassword;
