import { Metadata } from "next";
import Image from "next/image";
import { SigninForm } from "@/components/forms";

export const metadata: Metadata = {
  title: "Sign-in | Talents Explore",
  description: "Sign-in to your account to start exploring at Talents Explore",
};

const Signin = () => {
  return (
    <div className="flex-between w-full">
      <Image
        src="/assets/images/auth-img.png"
        alt="auth-img"
        width={1000}
        height={1000}
        className="h-screen w-3/5 object-cover"
        priority
        blurDataURL="data:/assets/images/Auth-Image.png"
        placeholder="blur"
      />
      <div className="flex-center w-2/5 flex-col">
        <div className="flex-center max-w-[26rem] flex-col p-4 lg:w-3/5">
          <h1 className="h1-bold w-full text-light-900">
            Welcome Back <br />
            to Talents Explore!
          </h1>
          <h3 className="base-medium w-full text-light-900">
            Please Log In to Your Account
          </h3>
          <SigninForm />
        </div>
      </div>
    </div>
  );
};

export default Signin;
