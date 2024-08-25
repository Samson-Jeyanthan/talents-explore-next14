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
      {src ? (
        <Image
          src={src}
          alt={userName}
          width={512}
          height={512}
          className="size-12 rounded-full bg-dark-400 object-cover"
        />
      ) : (
        <div
          className="size-12 rounded-full bg-dark-400 bg-top bg-no-repeat"
          style={{
            backgroundImage: `url(../../../../public/assets/images/default_profile_pic.png)`,
          }}
        ></div>
      )}
    </>
  );
};

export default UserProfileImg;
