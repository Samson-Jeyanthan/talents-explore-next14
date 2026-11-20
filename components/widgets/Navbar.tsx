import NotificationSheet from "./NotificationSheet";
import ChatNavButton from "./ChatNavButton";
import Theme from "../options/Theme";
import CurrentUserAvatar from "./CurrentUserAvatar";
import { UserTagAndSearch } from "../inputs";
import { getAllNotificationsAction } from "@/actions/notification.action";
import { getChatUnreadCountAction } from "@/actions/chat.action";

const Navbar = async ({ userId }: { userId: string }) => {
  const [notificationRes, chatUnreadCount] = await Promise.all([
    getAllNotificationsAction(userId, 1, 20),
    getChatUnreadCountAction(),
  ]);

  return (
    <nav className="!sticky !inset-x-0 !top-0 z-[99] flex h-14 w-full min-w-0 items-center justify-between gap-3 bg-dark-200/50 p-3 text-light-900 shadow-sm backdrop-blur-[200px] sm:px-6 sm:pl-12">
      <UserTagAndSearch isTag={false} />
      <ul className="flex-center shrink-0 gap-1 sm:gap-2">
        <Theme />
        <ChatNavButton unreadCount={chatUnreadCount.oneToOne} />
        <NotificationSheet data={notificationRes} />
        <CurrentUserAvatar />
      </ul>
    </nav>
  );
};

export default Navbar;
