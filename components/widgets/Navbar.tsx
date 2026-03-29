import NotificationSheet from "./NotificationSheet";
import ChatNavButton from "./ChatNavButton";
import { Theme } from "../options";
import CurrentUserAvatar from "./CurrentUserAvatar";
import { UserTagAndSearch } from "../inputs";
import { getAllNotificationsAction } from "@/actions/notification.action";
import { getChatUnreadCountAction } from "@/actions/chat.action";

const Navbar = async ({ userId }: { userId: string }) => {
  const [notificationRes, chatUnreadCount] = await Promise.all([
    getAllNotificationsAction(userId, 1, 10),
    getChatUnreadCountAction(),
  ]);

  return (
    <nav className="sticky inset-x-0 top-0 z-[99] flex h-14 w-full items-center justify-between bg-dark-200/50 p-4 px-6 pl-12 text-light-900 shadow-sm backdrop-blur-[200px]">
      <UserTagAndSearch isTag={false} />
      <ul className="flex-center gap-2">
        <Theme />
        <ChatNavButton unreadCount={chatUnreadCount.oneToOne} />
        <NotificationSheet data={notificationRes} />
        <CurrentUserAvatar />
      </ul>
    </nav>
  );
};

export default Navbar;
