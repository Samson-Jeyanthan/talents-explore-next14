import {
  getLanguagesAction,
  getMainCategoriesAction,
} from "@/actions/utils.action";
import { ParentCreatePostForm } from "@/components/widgets/multiStepForms";

const CreatePost = async () => {
  const langData = await getLanguagesAction();
  const mainCategoryData = await getMainCategoriesAction();

  return (
    <section className="w-full py-8 2xl:max-w-screen-xl">
      <ParentCreatePostForm
        langData={langData}
        mainCategoryData={mainCategoryData}
      />
    </section>
  );
};

export default CreatePost;
