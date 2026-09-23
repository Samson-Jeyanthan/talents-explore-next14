"use client";

import Link from "next/link";
import { SigninValidation } from "@/lib/validations/auth.validation";
import { signinAction } from "@/actions/auth.action";
import { AUTH_USER_CACHE_KEY, useUserContext } from "@/context/AuthProvider";
import { useGlobalLoading } from "@/context/LoadingProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FormInput } from "../inputs";

const SigninForm = () => {
  const { setUser } = useUserContext();
  const { beginLoading } = useGlobalLoading();
  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof SigninValidation>) {
    const finishLoading = beginLoading("Signing in...");
    let redirecting = false;
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
        const nextUser = {
          currentUserId: res?.response?._id,
          firstName: res?.response?.personalInfo?.firstName,
          lastName: res?.response?.personalInfo?.lastName,
          username: res?.response?.userName,
          email: res?.response?.email,
          imageUrl: res?.response?.personalInfo?.profileImage,
          isTalent: res?.response?.isTalent,
        };
        setUser(nextUser);
        sessionStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(nextUser));

        const redirectPath = res?.response?.personalInfo?.firstName
          ? "/home"
          : "/complete-profile";

        // Use a full document navigation so the new auth cookie is guaranteed
        // to be visible to middleware and server components immediately.
        redirecting = true;
        window.location.assign(redirectPath);
        return;
      } else {
        toast.error("Sign In Failed, Invalid Email or Password.", {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      toast.error("Unable to sign in right now. Please try again.", { duration: 4000 });
    } finally {
      if (!redirecting) {
        finishLoading();
      }
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
          disabled={form.formState.isSubmitting}
          className="shad-button_primary mt-4"
        >
          {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
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
