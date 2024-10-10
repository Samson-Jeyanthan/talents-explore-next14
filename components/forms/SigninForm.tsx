"use client";

import Link from "next/link";
import { SigninValidation } from "@/lib/validations/authValidation";
import { signinAction } from "@/actions/auth.action";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/context/AuthProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FormInput } from "../inputs";
import { useState } from "react";

const SigninForm = () => {
  const { setUser } = useUserContext();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof SigninValidation>) {
    setIsLoading(true);
    const formData = {
      email: values.email,
      password: values.password,
      deviceId: "string",
      appVersion: "string",
    };

    try {
      const res = await signinAction(formData);
      if (res?.status === "7400") {
        toast.success("Sign In Successfully", { duration: 4000 });
        setUser({
          currentUserId: res?.response?._id,
          firstName: res?.response?.personalInfo?.firstName,
          lastName: res?.response?.personalInfo?.lastName,
          username: res?.response?.userName,
          email: res?.response?.email,
          imageUrl: res?.response?.personalInfo?.profileImage,
          isTalent: res?.response?.isTalent,
        });
        if (res?.response?.personalInfo?.firstName) {
          router.push("/home");
        } else {
          router.push("/complete-profile");
        }
      } else {
        setIsLoading(false);
        toast.error("Sign In Failed, Invalid Email or Password.", {
          duration: 4000,
        });
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-4 flex w-full flex-col gap-2 2xl:gap-5"
      >
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
        <p className="-my-3 flex w-full items-center justify-end">
          <Link
            href="/forgot-password"
            className="font-regular text-light-500 hover:text-light-900"
          >
            forgot password?
          </Link>
        </p>
        <Button
          type="submit"
          disabled={isLoading}
          className="shad-button_primary mt-4"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
        <div className="auth-or" />
        <p className="flex-center body-regular gap-4 text-center text-sm text-light-500">
          Don&apos;t have an account?
          <Link
            href="/join-us"
            className="text-primary-500 hover:text-light-900"
          >
            Join us
          </Link>
        </p>
      </form>
    </Form>
  );
};

export default SigninForm;
