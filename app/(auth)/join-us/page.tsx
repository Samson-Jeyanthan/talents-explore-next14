import { Metadata } from "next";
import Image from "next/image";
import { JoinusForm } from "@/components/forms";

export const metadata: Metadata = {
  title: "Join-us | Talents Explore",
  description:
    "Create an account and start exploring at talents explore by join us or sign up with our platform.",
};

const Joinus = () => {
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
            Sign Up & <br /> Start Exploring
          </h1>
          <h3 className="base-medium w-full text-light-900">
            Your Adventure Awaits!
          </h3>
          <JoinusForm />
        </div>
      </div>
    </div>
  );
};

export default Joinus;
