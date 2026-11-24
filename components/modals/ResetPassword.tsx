"use client";

import { useRouter } from "next/navigation";
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
  const form = useForm<z.infer<typeof ResetPasswordValidation>>({
    resolver: zodResolver(ResetPasswordValidation),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof ResetPasswordValidation>) {
    const formData = {
      userId: verifiedUserId,
      otp: verifiedOtp,
      newPassword: values.password,
    };
    const res = await resetPasswordAction(formData);
    if (res.status === true) {
      clearOtpSession("password");
      toast.success("Password Has Reset Successfully", { duration: 5000 });
      router.push("/sign-in");
    } else {
      toast.error(res.message, { duration: 5000 });
    }
  }

  const handleCancel = async () => {
    clearOtpSession("password");
    router.push("/sign-in");
  };

  return (
    <>
      <DialogOverlay className={cn("bg-black/10 backdrop-blur-sm")} />
      <DialogContent className="flex max-w-96 flex-col items-center gap-3 rounded-xl border-none bg-dark-250 p-5">
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
            className="mt-4 flex w-full flex-col items-center gap-5"
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
              disabled={form.formState.isSubmitting}
            >
              Submit
            </Button>
            <p
              className="font-regular my-3 cursor-pointer text-light-700 hover:text-light-900"
              onClick={handleCancel}
            >
              Cancel
            </p>
          </form>
        </Form>
      </DialogContent>
    </>
  );
};

export default ResetPassword;
