import { userEducationInfoAction } from "@/actions/user.action";
import { TProfileURLProps } from "@/types/utils.types";
import React from "react";
import ProfDetailsHeader from "./ProfDetailsHeader";

const EducationDetails = async ({ params }: TProfileURLProps) => {
  const data = await userEducationInfoAction(params.userId);
  if (data?.status === 400) return null;

  return (
    <article className="professional-info-card-wrap">
      <ProfDetailsHeader detailName="education" dataArray={data && data} />
      {data}
    </article>
  );
};

export default EducationDetails;
