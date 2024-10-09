import NotificationSheet from "./NotificationSheet";
import { Theme } from "../options";
import CurrentUserAvatar from "./CurrentUserAvatar";

const Navbar = () => {
  return (
    <nav className="sticky inset-x-0 top-0 z-[99] flex h-14 w-full items-center justify-end bg-dark-200/50 text-light-900 shadow-sm backdrop-blur-[200px]">
      <ul className="flex-center gap-2 p-4">
        <Theme />
        <NotificationSheet />
        <CurrentUserAvatar />
      </ul>
    </nav>
  );
};

export default Navbar;
