import {
  getCountriesAction,
  getLanguagesAction,
  getMainCategoriesAction,
} from "@/actions/utils.action";
import { ParentCreatePostShareForm } from "@/components/widgets/multiStepForms";

const CreatePost = async () => {
  const langData = await getLanguagesAction();
  const mainCategoryData = await getMainCategoriesAction();
  const countryData = await getCountriesAction();

  return (
    <section className="w-full py-8 2xl:max-w-screen-xl">
      <ParentCreatePostShareForm
        langData={langData}
        mainCategoryData={mainCategoryData}
        countryData={countryData}
        formType="POST"
      />
    </section>
  );
};

export default CreatePost;
