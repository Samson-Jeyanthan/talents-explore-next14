import { getPostByIdAction } from "@/actions/post.action";
import { resolveViewerIdAction } from "@/actions/tokenAndHeaders.action";
import {
  getCountriesAction,
  getLanguagesAction,
  getMainCategoriesAction,
  getSkillsAction,
  getStatesAction,
  getSubCategoriesAction,
} from "@/actions/utils.action";
import ParentCreatePostShareForm from "@/components/multiStepForms/ParentCreatePostShareForm";
import { getPostType } from "@/lib/utils/postEditing";
import { notFound, redirect } from "next/navigation";

export default async function PostEditorPage({
  id,
  expectedType,
}: {
  id: string;
  expectedType: "POST" | "SHARELINK";
}) {
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  const viewerId = await resolveViewerIdAction();
  const post = await getPostByIdAction(id, viewerId);
  if (post?.status === 404 || post?.status === 400) notFound();
  if (!post?._id)
    throw new Error("Unable to load this post for editing. Please try again.");
  const authorId =
    typeof post.author === "string" ? post.author : post.author?._id;
  if (authorId !== viewerId) notFound();
  const formType = getPostType(post);
  if (formType !== expectedType)
    redirect(`/${formType === "SHARELINK" ? "share" : "post"}/edit/${id}`);
  const [
    langData,
    mainCategoryData,
    countryData,
    subcategories,
    skills,
    states,
  ] = await Promise.all([
    getLanguagesAction(),
    getMainCategoriesAction(),
    getCountriesAction(),
    post.about?.mainCategoryId
      ? getSubCategoriesAction(post.about.mainCategoryId)
      : null,
    post.about?.subCategoryId
      ? getSkillsAction(post.about.subCategoryId)
      : null,
    post.about?.country ? getStatesAction(post.about.country) : null,
  ]);
  return (
    <section className="w-full py-8 2xl:max-w-screen-xl">
      <ParentCreatePostShareForm
        key={post._id}
        formType={formType}
        initialPost={post}
        langData={langData}
        mainCategoryData={mainCategoryData}
        countryData={countryData}
        initialOptions={{
          subcategories: subcategories?.response || [],
          skills: skills?.response || [],
          states: states?.response || [],
        }}
      />
    </section>
  );
}
