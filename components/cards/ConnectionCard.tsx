import Link from "next/link";
import ConnectionButton from "../buttons/ConnectionButton";
import { MotionDiv } from "../others/MotionDiv";
import UserProfileImg from "../others/UserProfileImg";
import { StarIcon } from "@/public/assets/svgs";

export interface IConnectionListProp {
  _id: string;
  isTalent: boolean;
  userName: string;
  name: string;
  isFollow: number;
  profileImage: string;
  professional: {
    professional: string;
  };
}

interface Prop {
  connectCard: IConnectionListProp;
  index: number;
  viewerId: string | undefined;
  connectionTab?: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

function ConnectionCard({ connectCard, index, viewerId, connectionTab }: Prop) {
  return (
    <MotionDiv
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{
        delay: index * 0.15,
        ease: "easeInOut",
        duration: 0.3,
      }}
      viewport={{ amount: 0 }}
      className="flex-between w-[95%] gap-2"
    >
      <div className="flex items-center justify-center gap-2">
        <Link
          href={`/profile/${connectCard.userName}/${connectCard._id}`}
          className="relative"
        >
          <UserProfileImg
            src={connectCard.profileImage}
            userName={connectCard.name}
          />
          {connectCard.isTalent && (
            <span className="flex-center absolute -bottom-px -right-px rounded-full bg-dark-250 fill-custom-100 p-[2px]">
              <StarIcon width="13px" height="13px" />
            </span>
          )}
        </Link>
        <Link
          href={`/profile/${connectCard.userName}/${connectCard._id}`}
          className=""
        >
          <p className="text-sm text-light-900">{connectCard.userName}</p>
          <p className="text-xs text-light-600">
            {connectCard.professional.professional}
          </p>
        </Link>
      </div>
      {connectCard.isTalent && (
        <ConnectionButton
          isFollow={connectCard.isFollow}
          viewerId={viewerId}
          userId={connectCard._id}
          userName={connectCard.userName}
          isOwnProfile={connectCard._id === viewerId}
          connectionTab={connectionTab}
        />
      )}
    </MotionDiv>
  );
}

export default ConnectionCard;
