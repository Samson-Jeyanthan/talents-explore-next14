import { TCurrentUserData, TPublicUserData } from "@/types/profile.types";
import { FiUser } from "react-icons/fi";

const BioDetails = ({
  userData,
}: {
  userData: TCurrentUserData | TPublicUserData;
}) => {
  return (
    <section className="flex flex-col gap-2">
      <h1>Bio Details</h1>
      <div>
        <FiUser />
        <div>
          <p>{userData?.personalInfo?.firstName}</p>
          <p>{userData?.personalInfo?.lastName}</p>
        </div>
      </div>
      <p>{userData?.location}</p>
      <p>{userData?.personalInfo?.language}</p>
      <p>{userData?.morePersonalInfo?.ethnic}</p>
      <p className="w-1/2 text-justify">{userData?.morePersonalInfo?.bio}</p>
    </section>
  );
};

export default BioDetails;
