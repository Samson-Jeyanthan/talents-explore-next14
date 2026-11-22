import { Metadata } from "next";
import Image from "next/image";
import { JoinusForm } from "@/components/forms";
import PolicyLinks from "@/components/legal/PolicyLinks";

export const metadata: Metadata = {
  title: "Join-us | Talents Explore",
  description:
    "Create an account and start exploring at talents explore by join us or sign up with our platform.",
};

const Joinus = () => {
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
            Sign Up &amp; <br />
            Start Exploring
          </h1>
          <h3 className="base-medium w-full text-light-900">
            Your Adventure Awaits!
          </h3>
          <JoinusForm />
        </div>
      </section>
      <footer className="auth-footer border-dark-400">
        <PolicyLinks />
      </footer>
    </div>
  );
};

export default Joinus;
