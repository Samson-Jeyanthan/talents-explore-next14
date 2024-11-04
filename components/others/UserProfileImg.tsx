import { cn } from "@/lib/utils";
import Image from "next/image";

const UserProfileImg = ({
  src,
  userName,
  userId,
  className,
}: {
  src?: string | null;
  userName: string;
  userId?: string;
  className?: string;
}) => {
  return (
    <>
      <Image
        src={src || "/assets/images/default_profile_pic_2.png"}
        alt={userName}
        width={512}
        height={512}
        className={cn(
          "text-sm text-muted-foreground size-10 min-w-10 min-h-10 rounded-full bg-dark-400 object-cover",
          className
        )}
      />
    </>
  );
};

export default UserProfileImg;
