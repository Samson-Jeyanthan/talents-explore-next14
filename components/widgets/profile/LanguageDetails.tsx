import { userLanguageInfoAction } from "@/actions/user.action";
import { TProfileURLProps } from "@/types/utils.types";
import ProfDetailsHeader from "./ProfDetailsHeader";

const LanguageDetails = async ({ params }: TProfileURLProps) => {
  const data = await userLanguageInfoAction(params.userId);
  if (data?.status === 400) return null;
  return (
    <div className="professional-info-card-wrap">
      <ProfDetailsHeader detailName="language" dataArray={data && data} />
      {data}
    </div>
  );
};

export default LanguageDetails;
