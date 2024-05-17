"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { DialogContent, DialogOverlay } from "../ui/dialog";
import { cn } from "@/lib/utils";
import { ResetPasswordValidation } from "@/lib/validation/authValidation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "../ui/form";
import { FormInput } from "../inputs";
import { handleResetPassword } from "@/lib/functions/auth.functions";

const ResetPassword = ({ verifiedUserId }: { verifiedUserId: string }) => {
  const router = useRouter();
  const form = useForm<z.infer<typeof ResetPasswordValidation>>({
    resolver: zodResolver(ResetPasswordValidation),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof ResetPasswordValidation>) {
    console.log(values);
    const formData = {
      userId: verifiedUserId,
      newPassword: values.password,
    };
    const response = await handleResetPassword(formData);
    if (response) {
      router.push("/sign-in");
    }
  }

  const handleCancel = () => {
    localStorage.removeItem("countdown");
    localStorage.removeItem("isOTP");
    router.push("/sign-in");
  };

  return (
    <>
      <DialogOverlay className={cn("bg-black/10 backdrop-blur-sm")} />
      <DialogContent className="flex max-w-96 flex-col items-center gap-3 border-none bg-dark-250 p-5">
        <h1 className="h1-bold text-light-900">Reset Password</h1>
        <p className="text-justify text-[12px] text-light-900">
          Enter your new password and confirm it to update your account
          credentials.
        </p>
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
            <Button type="submit" className="shad-button_primary w-full">
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
