import { NotificationIcon } from "@/public/assets/svgs";
import { Theme } from "../options";
import CurrentUserAvatar from "./CurrentUserAvatar";

const Navbar = () => {
  return (
    <nav className="sticky inset-x-0 top-0 z-[99] flex h-14 w-full items-center justify-end bg-dark-200 text-light-900">
      <ul className="flex-center gap-2 p-4">
        <Theme />
        <li className="flex-center size-9 cursor-pointer rounded-full bg-dark-300 fill-light-600 hover:bg-dark-400 hover:fill-light-900">
          <NotificationIcon height="20px" width="20px" />
        </li>
        <CurrentUserAvatar size="size-8" />
      </ul>
    </nav>
  );
};

export default Navbar;
