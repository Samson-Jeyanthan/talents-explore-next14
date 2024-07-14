import { NotificationIcon } from "@/public/assets/svgs";
import UserAvatar from "./UserAvatar";
import Theme from "./Theme";

const Navbar = () => {
  return (
    <nav className="absolute inset-x-0 top-0 flex h-14 items-center justify-end text-light-900">
      <ul className="flex gap-2 p-4">
        <Theme />
        <li className="flex-center size-10 cursor-pointer rounded-full bg-dark-300 fill-light-600 hover:bg-dark-400 hover:fill-light-900">
          <NotificationIcon height="20px" width="20px" />
        </li>
        <UserAvatar size="size-10" />
      </ul>
    </nav>
  );
};

export default Navbar;
