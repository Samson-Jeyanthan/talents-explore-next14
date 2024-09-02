import { userLanguageInfoAction } from "@/actions/user.action";
import { TProfileURLProps } from "@/types/utils.types";

const LanguageDetails = async ({ params }: TProfileURLProps) => {
  const data = await userLanguageInfoAction(params.userId);
  return <div>{data}</div>;
};

export default LanguageDetails;
