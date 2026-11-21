import { getLanguagesAction } from "@/actions/utils.action";
import { ParentTalentRegisterForm } from "@/components/multiStepForms";
import React from "react";

const TalentRegistration = async () => {
  const langData = await getLanguagesAction();

  return (
    <section className="flex-center size-full p-2">
      <ParentTalentRegisterForm langData={langData} />
    </section>
  );
};

export default TalentRegistration;
