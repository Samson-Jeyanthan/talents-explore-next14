import { userAwardInfoAction } from "@/actions/user.action";
import { TProfileURLProps } from "@/types/utils.types";

const AwardsAndCertificates = async ({ params }: TProfileURLProps) => {
  const data = await userAwardInfoAction(params.userId);
  return <div>{data}</div>;
};

export default AwardsAndCertificates;
