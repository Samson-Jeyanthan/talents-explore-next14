import Link from "next/link";
import UserProfileImg from "../others/UserProfileImg";

interface Props {
  notificationCard: any;
  index: number;
  onClick: () => void;
}
const NotificationCard = ({ notificationCard, index, onClick }: Props) => {
  const handleSheetClose = () => {
    onClick();
  };

  const getEventText = (jsonKey: string) => {
    switch (jsonKey) {
      case "ratingPost":
        return "has rated your post";
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
      <UserProfileImg
        userName={notificationCard?.senderUserName}
        src={notificationCard?.senderProfilePicture}
        userId={notificationCard?.senderId}
      />
      <div className="flex w-full items-start justify-between">
        <div className="flex flex-col gap-[2px]">
          <Link
            href={`/profile/${notificationCard?.senderUserName}/${notificationCard?.senderId}`}
            onClick={handleSheetClose}
            className="text-sm font-medium text-light-900"
          >
            @{notificationCard?.senderUserName}
          </Link>
          <span className="text-xs text-light-500">
            {getEventText(notificationCard?.jsonKey)}
          </span>
        </div>
        <p className="text-xs text-light-500">{notificationCard?.timeAgo}</p>
      </div>
    </article>
  );
};

export default NotificationCard;
