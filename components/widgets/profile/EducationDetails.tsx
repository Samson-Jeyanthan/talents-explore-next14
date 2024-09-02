import { userEducationInfoAction } from "@/actions/user.action";
import { TProfileURLProps } from "@/types/utils.types";
import React from "react";

const EducationDetails = async ({ params }: TProfileURLProps) => {
  const data = await userEducationInfoAction(params.userId);
  return <div>{data}</div>;
};

export default EducationDetails;
