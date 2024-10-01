import Image from "next/image";

const Promotion = () => {
  return (
    <section className="flex-center relative h-screen w-full p-1">
      <Image
        src="/assets/images/promotion-growth.png"
        width={512}
        height={512}
        alt="benefit"
        className="z-10 h-[80vh] w-full object-contain"
      />
      <div className="absolute -left-60 z-0 h-[55vh] w-1/4 rounded-full bg-primary-500 opacity-15 blur-[300px] 2xl:-left-80" />
      <div className="flex w-4/5 flex-col items-start justify-start gap-12 pb-12 2xl:gap-24">
        <h1 className="h1-bold mr-16 flex flex-col gap-6 text-6xl font-semibold text-light-900 2xl:text-8xl">
          Promotion
          <span className="ml-36 2xl:ml-56">& Growth</span>
        </h1>
        <div className="flex flex-col items-start justify-items-start gap-6 text-lg text-light-900 2xl:text-[20px]">
          <p>Showcase your work to reach a wide audience and get noticed.</p>
          <p>Collaborate with other talented individuals.</p>
          <p>Connect with like-minded talents in your area and globally.</p>
        </div>
      </div>
    </section>
  );
};

export default Promotion;
