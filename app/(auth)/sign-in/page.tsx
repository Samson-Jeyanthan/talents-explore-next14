import { Metadata } from "next";
import Image from "next/image";
import { SigninForm } from "@/components/forms";
import PolicyLinks from "@/components/legal/PolicyLinks";

export const metadata: Metadata = {
  title: "Sign-in | Talents Explore",
  description: "Sign-in to your account to start exploring at Talents Explore",
};

const Signin = async () => {
  return (
    <div className="auth-screen">
      <div className="auth-visual">
        <Image
          src="/assets/images/auth-img.png"
          alt="auth-img"
          fill
          sizes="60vw"
          className="object-cover"
          priority
          blurDataURL="data:/assets/images/Auth-Image.png"
          placeholder="blur"
        />
      </div>
      <section className="auth-panel">
        <div className="auth-content">
          <h1 className="h1-bold w-full text-light-900">
            Welcome Back <br />
            to Talents Explore!
          </h1>
          <h3 className="base-medium w-full text-light-900">
            Please Log In to Your Account
          </h3>
          <SigninForm />
        </div>
      </section>
      <footer className="auth-footer border-dark-400">
        <PolicyLinks />
      </footer>
    </div>
  );
};

export default Signin;
