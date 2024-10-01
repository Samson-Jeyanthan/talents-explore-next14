import { cn } from "@/lib/utils";
import Image from "next/image";

const UserProfileImg = ({
  src,
  userName,
  className,
}: {
  src?: string | null;
  userName: string;
  className?: string;
}) => {
  return (
    <>
      <Image
        // eslint-disable-next-line no-unneeded-ternary
        src={src || "/assets/images/default_profile_pic_2.png"}
        alt={userName}
        width={512}
        height={512}
        className={cn(
          "text-sm text-muted-foreground size-10 rounded-full bg-dark-400 object-cover",
          className
        )}
      />
    </>
  );
};

export default UserProfileImg;
