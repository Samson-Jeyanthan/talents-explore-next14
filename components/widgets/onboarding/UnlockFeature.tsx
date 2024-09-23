import Image from "next/image";

const UnlockFeature = () => {
  return (
    <div className="flex-center relative">
      <div className="absolute z-10 h-[65%] w-3/5 rounded-full bg-primary-500 opacity-40 blur-[500px]" />
      <div className="absolute z-10 h-screen w-[90vw] rounded-full bg-dark-200 opacity-65 blur-3xl" />
      <div className="absolute z-10 h-screen w-[30vw] -rotate-12 bg-dark-200" />
      <div className="absolute z-10 flex items-start gap-4">
        <Image
          src="/assets/svgs/unlock-icon.svg"
          width={56}
          height={56}
          alt="img"
          className="mt-2 size-11 2xl:size-14"
        />
        <div className="flex flex-col gap-2">
          <h1 className="h1-bold flex gap-6 text-6xl font-semibold text-light-900 2xl:text-7xl">
            Unlock
          </h1>

          <h2 className="h1-bold flex flex-col text-[38px] font-semibold text-light-900 2xl:text-[42px]">
            More Features
          </h2>
        </div>
      </div>
      <Image
        src="/assets/images/unlock-feature.png"
        width={2200}
        height={2200}
        alt="img"
        className="h-[80vh] w-full object-cover"
      />
    </div>
  );
};

export default UnlockFeature;
