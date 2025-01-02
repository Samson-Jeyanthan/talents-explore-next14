import NotificationSheet from "./NotificationSheet";
import { Theme } from "../options";
import CurrentUserAvatar from "./CurrentUserAvatar";
import { UserTagAndSearch } from "../inputs";
import { getAllNotificationsAction } from "@/actions/notification.action";

const Navbar = async ({ userId }: { userId: string }) => {
  const notificationRes = await getAllNotificationsAction(userId, 1, 10);

  return (
    <nav className="sticky inset-x-0 top-0 z-[99] flex h-14 w-full items-center justify-between bg-dark-200/50 p-4 px-6 pl-12 text-light-900 shadow-sm backdrop-blur-[200px]">
      <UserTagAndSearch isTag={false} />
      <ul className="flex-center gap-2">
        <Theme />
        <NotificationSheet data={notificationRes} />
        <CurrentUserAvatar />
      </ul>
    </nav>
  );
};

export default Navbar;
