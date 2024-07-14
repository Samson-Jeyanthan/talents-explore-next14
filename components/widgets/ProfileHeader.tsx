import Image from "next/image";

const ProfileHeader = () => {
  return (
    <header>
      <Image
        src="/assets/images/sample-profile-cover-photo.jpg"
        width={1948}
        height={1948}
        alt="cover photo"
        className="h-[40vh] w-full object-cover"
      />
      <div className="-mt-24 h-48 w-full bg-[rgba(17,19,27,0.80)] backdrop-blur-xl"></div>
    </header>
  );
};

export default ProfileHeader;
