"use client";

import Link from "next/link";
import { SigninValidation } from "@/lib/validations/signin.validation";
import { signinAction } from "@/actions/auth.action";
import { useUserContext } from "@/context/AuthProvider";
import { writeCachedAuthUser } from "@/lib/utils/auth-user-cache";
import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FormInput } from "../inputs";

const SigninForm = () => {
  const { setUser } = useUserContext();
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
  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof SigninValidation>) {
    if (request.current.busy) return;
    request.current.busy = true;
    setPending(true);
    const version = request.current.version;
    const isCurrent = () =>
      request.current.active && request.current.version === version;
    let redirecting = false;
    const formData = {
      email: values.email,
      password: values.password,
      deviceId: "deviceId",
      appVersion: "Application.nativeApplicationVersion",
    };

    try {
      const res = await signinAction(formData);
      if (!isCurrent()) return;

      if (res?.status === "7400") {
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
        writeCachedAuthUser(nextUser);

        const redirectPath = res?.response?.personalInfo?.firstName
          ? "/home"
          : "/complete-profile";

        // Use a full document navigation so the new auth cookie is guaranteed
        // to be visible to middleware and server components immediately.
        window.location.assign(redirectPath);
        redirecting = true;
        toast.success("Signed in successfully", { duration: 4000 });
      } else {
        toast.error(res.message, {
          duration: 4000,
        });
      }
    } catch {
      if (isCurrent())
        toast.error("Unable to sign in right now. Please try again.", {
          duration: 4000,
        });
    } finally {
      if (isCurrent() && !redirecting) {
        request.current.busy = false;
        setPending(false);
      }
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        aria-busy={pending}
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
          disabled={pending || form.formState.isSubmitting}
          className="shad-button_primary mt-4"
        >
          {pending || form.formState.isSubmitting ? "Signing in..." : "Sign in"}
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
