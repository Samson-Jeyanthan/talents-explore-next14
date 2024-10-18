"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SignupValidation } from "@/lib/validations/auth.validation";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import Link from "next/link";
import { useEffect, useState } from "react";
import { OTPModal } from "../modals";
import { Dialog } from "../ui/dialog";
import { FormInput } from "../inputs";
import { registerAction } from "@/actions/auth.action";
import { toast } from "sonner";
import { useUserContext } from "@/context/AuthProvider";

const JoinusForm = () => {
  const { setUser } = useUserContext();
  const [isOTPOpen, setIsOTPOpen] = useState(false);
  const [decodedUserId, setDecodedUserId] = useState<any>("");

  const form = useForm<z.infer<typeof SignupValidation>>({
    resolver: zodResolver(SignupValidation),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof SignupValidation>) {
    const formData = {
      email: values.email,
      password: values.password,
      userName: values.username,
    };
    const res = await registerAction(formData);

    if (res?.status === "7400") {
      setUser({
        currentUserId: res.response,
        firstName: "",
        lastName: "",
        username: formData.userName,
        email: formData.email,
        imageUrl: null,
        isTalent: false,
      });
      localStorage.setItem("registerUserId", res.response);
      setDecodedUserId(res.response);
      toast.success("You Have Registered Successfully", { duration: 3000 });
      localStorage.setItem("isOTP", "true");
      setIsOTPOpen(true);
    } else if (res?.status === "7405") {
      toast.error("Registration Failed, Email or Username is alreay in use", {
        duration: 4000,
      });
    } else {
      toast.error("Something went wrong, please try again", {
        duration: 4000,
      });
    }
  }

  // check if OTP is open even user refresh the page
  useEffect(() => {
    const isTimer = localStorage.getItem("countdown") !== "00:00";
    const isOTP = localStorage.getItem("isOTP") === "true";
    const registerUserId: string | null =
      localStorage.getItem("registerUserId");
    if (isTimer || isOTP) {
      setIsOTPOpen(true);
      setDecodedUserId(registerUserId);
    }
  }, []);

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-4 flex w-full flex-col gap-3"
        >
          <FormInput
            form={form}
            formLabel="Username"
            inputName="username"
            inputType="text"
            placeholder="username"
          />

          <FormInput
            form={form}
            formLabel="Email"
            inputName="email"
            inputType="email"
            placeholder="email"
          />

          <FormInput
            form={form}
            formLabel="Password"
            inputName="password"
            inputType="password"
            placeholder="password"
          />
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="shad-button_primary mt-4"
          >
            {form.formState.isSubmitting ? "Joining..." : "Join us"}
          </Button>

          <div className="auth-or" />

          <p className="flex-center body-regular gap-4 text-center text-sm text-light-500">
            Already have an account?
            <Link
              href="/sign-in"
              className="text-primary-500 hover:text-light-900"
            >
              Sign in
            </Link>
          </p>
        </form>
      </Form>
      {isOTPOpen && decodedUserId && (
        <Dialog open={isOTPOpen}>
          <OTPModal userId={decodedUserId} isSignup={true} />
        </Dialog>
      )}
    </>
  );
};

export default JoinusForm;
