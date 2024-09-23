import Image from "next/image";

const Community = () => {
  return (
    <section className="relative flex h-screen w-full">
      <div className="relative flex w-2/5 items-start justify-start gap-8 p-8">
        <Image
          src="/assets/images/bw-group.png"
          width={512}
          height={512}
          alt="img"
          className="z-10 h-auto w-1/2 2xl:w-80"
        />
        <div className="z-10 flex w-1/2 flex-col gap-4">
          <Image
            src="/assets/images/team-work.png"
            width={512}
            height={512}
            alt="img"
            className="h-auto 2xl:w-80"
          />
          <div className="h-1 bg-primary-500 2xl:w-80" />
        </div>
        <Image
          src="/assets/svgs/RedBlurLight.svg"
          width={512}
          height={512}
          alt="red-light"
          className="absolute -top-10 right-0 z-0 size-full"
        />
      </div>

      <div className="flex w-3/5 flex-col items-center justify-start gap-12 p-16 pt-24 2xl:gap-24">
        <h1 className="h1-bold mr-16 flex flex-col gap-6 text-6xl font-semibold text-light-900 2xl:text-8xl">
          Community
          <span className="ml-36 2xl:ml-56">& Exposure</span>
        </h1>
        <div className="flex flex-col items-start justify-items-start gap-6 pl-4 text-lg text-light-900 2xl:pl-0 2xl:text-[20px]">
          <p>Showcase your work to reach a wide audience and get noticed.</p>
          <p>Collaborate with other talented individuals.</p>
          <p>Connect with like-minded talents in your area and globally.</p>
          <p>
            Connect and collaborate to enhance your reputation and unlock new
            opportunities.
          </p>
        </div>
      </div>
      <Image
        src="/assets/svgs/RedBlurLight.svg"
        width={512}
        height={512}
        alt="red-light"
        className="absolute right-[-60%] top-[-40%] z-0 size-full"
      />
    </section>
  );
};

export default Community;
