import Image from "next/image";
import { GoDotFill } from "react-icons/go";
import { Button } from "../ui/button";
import { ProfileOptions } from "../options";

const ProfileHeader = () => {
  return (
    <header className="-mt-32 flex w-full flex-col">
      <section className="flex items-end justify-between bg-gradient-to-t from-[rgb(17,19,27,0.75)] to-[rgba(17,19,27,0.0)] px-16 py-4">
        <div className="flex-start gap-5">
          <Image
            src="/assets/images/sample-profile-photo.jpg"
            width={1024}
            height={1024}
            alt="profile photo"
            className="size-24 rounded-full object-cover"
          />
          <div className="flex flex-col gap-1">
            <h1 className="text-6xl font-semibold text-light-900">
              Avantika Mishara
            </h1>
            <p className="flex-start gap-1 text-sm text-light-900">
              @avantika_mishara <GoDotFill className="text-[8px]" /> Designer
            </p>
          </div>
        </div>
        <div className="text-sm text-light-900">Rate this Profile</div>
      </section>
      <section className="flex items-start justify-between bg-gradient-to-b from-[rgb(17,19,27,0.70)] to-[rgba(17,19,27)] px-12 pt-2 backdrop-blur-lg">
        <div className="flex flex-col gap-2">
          <div className="flex-start">
            <h4 className="connection-counting">
              4.5K <span className="connection-counting-text">Ratings</span>
            </h4>

            <h4 className="connection-counting">
              21.5K <span className="connection-counting-text">Followers</span>
            </h4>

            <h4 className="connection-counting">
              709 <span className="connection-counting-text">Followings</span>
            </h4>
          </div>
          <p className="w-96 pl-3 text-xs text-light-600">
            Connect and collaborate to enhance your reputation and unlock new
            opportunities.
          </p>
        </div>
        <div className="flex-start gap-3">
          <Button className="shad-button_primary w-36">Follow</Button>
          <Button className="shad-button_secondary w-36">Message</Button>
          <ProfileOptions />
        </div>
      </section>
    </header>
  );
};

export default ProfileHeader;
