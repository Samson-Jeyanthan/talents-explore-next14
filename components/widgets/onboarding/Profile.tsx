import Image from "next/image";

const Profile = () => {
  return (
    <section className="relative flex h-screen w-full">
      <div className="flex w-1/2 flex-col gap-12 p-16 pt-28 2xl:gap-24">
        <h1 className="h1-bold mr-16 flex flex-col gap-6 text-6xl font-semibold text-light-900 2xl:text-8xl">
          Profile &<span className="ml-36 2xl:ml-56">Discoverability</span>
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
        src="/assets/images/ob-profile.png"
        width={1024}
        height={1024}
        alt="red-light"
        className="absolute -right-14 bottom-[-20%] z-0 h-auto w-[45%] rotate-[13deg] object-contain 2xl:bottom-[-15%] 2xl:w-[50rem]"
      />
    </section>
  );
};

export default Profile;
