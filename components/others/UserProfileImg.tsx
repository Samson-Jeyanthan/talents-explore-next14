import Image from "next/image";

const UserProfileImg = ({
  src,
  userName,
}: {
  src?: string;
  userName: string;
}) => {
  return (
    <>
      <Image
        // eslint-disable-next-line no-unneeded-ternary
        src={src ? src : "/assets/images/default_profile_pic_2.png"}
        alt={userName}
        width={512}
        height={512}
        className="size-12 rounded-full bg-dark-400 object-cover object-top"
      />
    </>
  );
};

export default UserProfileImg;
