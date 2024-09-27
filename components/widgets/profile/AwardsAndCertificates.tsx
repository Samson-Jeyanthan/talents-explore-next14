import { userAwardInfoAction } from "@/actions/user.action";
import AlertNote from "@/components/others/AlertNote";
import { TProfileURLProps } from "@/types/utils.types";
import { AwardsIcon } from "@/public/assets/svgs";

const AwardsAndCertificates = async ({ params }: TProfileURLProps) => {
  const data = await userAwardInfoAction(params.userId);
  if (data?.status === 400) return <AlertNote />;
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="profile-detail-heading w-[65%]">
        <AwardsIcon /> Awards & Certificates
      </div>
      <article className="flex w-full max-w-[22rem] flex-col rounded-2xl border-2 border-dark-400 bg-dark-300/70 p-2">
        {data}
      </article>
    </div>
  );
};

export default AwardsAndCertificates;
