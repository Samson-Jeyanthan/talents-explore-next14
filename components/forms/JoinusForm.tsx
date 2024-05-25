"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SignupValidation } from "@/lib/validations/authValidation";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import Link from "next/link";
import { useEffect, useState } from "react";
import { OTPModal } from "../modals";
import { Dialog } from "../ui/dialog";
import { FormInput } from "../inputs";

const JoinusForm = () => {
  const [isOTPOpen, setIsOTPOpen] = useState(false);

  const form = useForm<z.infer<typeof SignupValidation>>({
    resolver: zodResolver(SignupValidation),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof SignupValidation>) {
    console.log(values);
    // localStorage.setItem("isOTP", "true");
    // setIsOTPOpen(true);
    // setCountdown(10 * 60); // have to set 10 * 60
  }

  // check if OTP is open even user refresh the page
  useEffect(() => {
    const countdownValue = localStorage.getItem("countdown") ?? "0";
    const isTimer = parseInt(countdownValue) > 0;
    const isOTP = localStorage.getItem("isOTP") === "true";
    if (isTimer || isOTP) {
      setIsOTPOpen(true);
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
            <Link href="/sign-in" className=" text-primary-500">
              Sign in
            </Link>
          </p>
        </form>
      </Form>
      {isOTPOpen && (
        <Dialog open={isOTPOpen}>
          <OTPModal isSignup={true} />
        </Dialog>
      )}
    </>
  );
};

export default JoinusForm;
