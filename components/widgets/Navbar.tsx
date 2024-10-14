import NotificationSheet from "./NotificationSheet";
import { Theme } from "../options";
import CurrentUserAvatar from "./CurrentUserAvatar";
import { NavbarSearch } from "../inputs";

const Navbar = () => {
  return (
    <nav className="sticky inset-x-0 top-0 z-[99] flex h-14 w-full items-center justify-between bg-dark-200/50 p-4 px-6 pl-12 text-light-900 shadow-sm backdrop-blur-[200px]">
      <NavbarSearch />
      <ul className="flex-center gap-2">
        <Theme />
        <NotificationSheet />
        <CurrentUserAvatar />
      </ul>
    </nav>
  );
};

export default Navbar;
