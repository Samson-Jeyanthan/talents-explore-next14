import { userAwardInfoAction } from "@/actions/user.action";
import AlertNote from "@/components/others/AlertNote";
import { TProfileURLProps } from "@/types/utils.types";
import ProfDetailsHeader from "./ProfDetailsHeader";

const AwardsAndCertificates = async ({ params }: TProfileURLProps) => {
  const data = await userAwardInfoAction(params.userId);
  if (data?.status === 400) return <AlertNote />;
  return (
    <div className="professional-info-card-wrap">
      <ProfDetailsHeader detailName="award" dataArray={data && data} />
      {data}
    </div>
  );
};

export default AwardsAndCertificates;
