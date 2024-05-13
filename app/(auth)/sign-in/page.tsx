"use client";
import Link from "next/link";
import { SigninValidation } from "@/lib/validation/authValidation";
import { signinAction } from "@/actions/auth.action";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Signin = () => {
  const router = useRouter();
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
    console.log(res);
    if (res?.status === "7400") {
      toast.success("Sign In Successfully", { duration: 6000 });
      router.push("/");
    } else {
      toast.error("Sign In Failed, Invalid Email or Password.", {
        duration: 9000,
      });
    }
  }

  return (
    <Form {...form}>
      <div className="flex-center w-full flex-col p-4 md:w-1/3 2xl:w-1/5">
        <h1 className="h1-bold w-full text-light-900">
          Welcome Back <br />
          to Talents Explore!
        </h1>
        <h3 className="base-medium w-full text-light-900">
          Please Log In to Your Account
        </h3>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-4 flex w-full flex-col gap-2 2xl:gap-5"
        >
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
            Sign in
          </Button>
          <div className="auth-or" />
          <p className="flex-center body-regular gap-4 text-center text-sm text-light-500">
            Don&apos;t have an account?
            <Link href="/join-us" className=" text-primary-500">
              Join us
            </Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default Signin;
