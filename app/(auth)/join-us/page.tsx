"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SignupValidation } from "@/lib/validation/authValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";

const Signup = () => {
  // 1. Define your form.
  const form = useForm<z.infer<typeof SignupValidation>>({
    resolver: zodResolver(SignupValidation),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof SignupValidation>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  }
  return (
    <Form {...form}>
      <div className="flex-center w-full flex-col p-4 md:w-1/3 2xl:w-1/5">
        <h1 className="h1-bold w-full text-light-900">
          Sign Up & <br /> Start Exploring
        </h1>
        <h3 className="base-medium w-full text-light-900">
          Your Adventure Awaits!
        </h3>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-4 flex w-full flex-col gap-3"
        >
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-auth_form_label">Username</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="username"
                    {...field}
                    className="shad-auth_form_input"
                  />
                </FormControl>
                <FormMessage className="shad-auth_form_message" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-auth_form_label">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email"
                    {...field}
                    className="shad-auth_form_input"
                  />
                </FormControl>
                <FormMessage className="shad-auth_form_message" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-auth_form_label">Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="password"
                    {...field}
                    className="shad-auth_form_input"
                  />
                </FormControl>
                <FormMessage className="shad-auth_form_message" />
              </FormItem>
            )}
          />
          <Button type="submit" className="shad-button_primary mt-4">
            Join us
          </Button>

          <div className="auth-or" />

          <p className="flex-center body-regular gap-4 text-center text-sm text-light-500">
            Already have an account?
            <Link href="/sign-in" className=" text-primary-500">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default Signup;
