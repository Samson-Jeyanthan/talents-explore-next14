import Link from "next/link";
import ConnectionButton from "../buttons/ConnectionButton";
import { MotionDiv } from "../others/MotionDiv";
import UserProfileImg from "../others/UserProfileImg";
import { StarIcon } from "@/public/assets/svgs";
import type { ConnectionUser } from "@/lib/utils/connections";

export type IConnectionListProp = ConnectionUser;

interface Prop {
  connectCard: IConnectionListProp;
  index: number;
  connectionTab?: number;
  isOwnList?: boolean;
  onChanged?: (following: boolean) => void;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

function ConnectionCard({
  connectCard,
  index,
  connectionTab,
  isOwnList,
  onChanged,
}: Prop) {
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
      className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-dark-400/50 bg-dark-250 p-3"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href={`/profile/${encodeURIComponent(connectCard.userName)}/${connectCard._id}`}
          className="relative shrink-0"
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
          href={`/profile/${encodeURIComponent(connectCard.userName)}/${connectCard._id}`}
          className="min-w-0"
        >
          <p className="break-all text-sm text-light-900">
            {connectCard.userName}
          </p>
          <p className="break-words text-xs text-light-600">
            {connectCard.professional?.professional}
          </p>
        </Link>
      </div>

      {(connectCard.isTalent || (isOwnList && connectionTab === 2)) && (
        <ConnectionButton
          isFollow={isOwnList && connectionTab === 2 ? 1 : connectCard.isFollow}
          userId={connectCard._id}
          userName={connectCard.userName}
          connectionTab={connectionTab}
          onChanged={onChanged}
        />
      )}
    </MotionDiv>
  );
}

export default ConnectionCard;
