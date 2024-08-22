"use client";

import Link from "next/link";
import { SigninValidation } from "@/lib/validations/authValidation";
import { signinAction } from "@/actions/auth.action";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FormInput } from "../inputs";
// import { AppDispatch } from "@/redux/store";
// import { useDispatch } from "react-redux";
// import { setIsAuthenticated } from "@/redux/slices/authSlice";
import { jwtDecode } from "jwt-decode";

const SigninForm = () => {
  const router = useRouter();
  // const dispatch = useDispatch<AppDispatch>();
  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof SigninValidation>) {
    const formData = {
      email: values.email,
      password: values.password,
      deviceId: "string",
      appVersion: "string",
    };

    const res = await signinAction(formData);
    console.log(res, "signin res");
    if (res?.status === "7400") {
      toast.success("Sign In Successfully", { duration: 4000 });
      const decodeToken = jwtDecode(res.response.accessToken);
      router.push(`/complete-profile/${decodeToken.sub}`);
      console.log(decodeToken, "decodeToken");
    } else {
      toast.error("Sign In Failed, Invalid Email or Password.", {
        duration: 4000,
      });
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
