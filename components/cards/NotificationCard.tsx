import Link from "next/link";
import UserProfileImg from "../others/UserProfileImg";
import { StarIcon } from "@/public/assets/svgs";
import { BsDot } from "react-icons/bs";

interface Props {
  notificationCard: any;
  index: number;
  onClick: () => void;
}
const NotificationCard = ({ notificationCard, index, onClick }: Props) => {
  const profileLink = `/profile/${notificationCard?.senderUserName}/${notificationCard?.senderId}`;
  const commentLink = `post/${notificationCard?.contentId}/#${notificationCard?._id}`;
  const postLink = `post/${notificationCard?.contentId}`;

  const handleSheetClose = () => {
    onClick();
  };

  const getEventText = (jsonKey: string) => {
    switch (jsonKey) {
      case "ratingPost":
        return (
          <Link
            href={postLink}
            className="flex-center gap-1.5 fill-custom-100 text-xs text-light-500"
          >
            has rated <StarIcon width="14px" height="14px" />
            <span className="text-light-900">
              {notificationCard?.contentJson?.ReRating}
            </span>
            to your post
          </Link>
        );
      case "commentPost":
        return "has commented on your post";
      case "userFollow":
        return "has started following you";
      default:
        return "";
    }
  };

  return (
    <article className="relative flex gap-3 rounded-[12px] border-2 border-dark-300 bg-dark-250 p-2">
      <Link href={profileLink}>
        <UserProfileImg
          userName={notificationCard?.senderUserName}
          src={notificationCard?.senderProfilePicture}
          userId={notificationCard?.senderId}
        />
      </Link>
      <div className="w-full">
        <div className="flex w-full items-start justify-between">
          <div className="flex flex-col gap-[2px]">
            <div className="flex items-center gap-1">
              <Link
                href={profileLink}
                onClick={handleSheetClose}
                className="text-sm font-medium text-light-900"
              >
                @{notificationCard?.senderUserName}
              </Link>
              <p className="flex items-center justify-start text-[11px] text-light-500">
                <BsDot className="text-xs" /> {notificationCard?.timeAgo} ago
              </p>
            </div>
            <p className="text-xs text-light-500">
              {getEventText(notificationCard?.jsonKey)}
            </p>
            {notificationCard?.jsonKey === "commentPost" && (
              <Link
                href={commentLink}
                className="line-clamp-5 text-[13px] text-light-800"
              >
                {notificationCard?.data?.comment}
              </Link>
            )}
          </div>

          {notificationCard?.jsonKey === "userFollow" ? (
            <p className="text-[11px] text-light-500">Follow</p>
          ) : (
            <p className="text-[11px] text-light-500">img</p>
          )}
        </div>
      </div>
    </article>
  );
};

export default NotificationCard;
