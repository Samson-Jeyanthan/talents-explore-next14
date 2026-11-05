import {
  getLanguagesAction,
  getMainCategoriesAction,
} from "@/actions/utils.action";
import { ParentTalentRegisterForm } from "@/components/multiStepForms";
import React from "react";

const TalentRegistration = async () => {
  const langData = await getLanguagesAction();
  const mainCategoryData = await getMainCategoriesAction();

  return (
    <section className="flex-center size-full p-2">
      <ParentTalentRegisterForm
        langData={langData}
        mainCategoryData={mainCategoryData}
      />
    </section>
  );
};

export default TalentRegistration;
