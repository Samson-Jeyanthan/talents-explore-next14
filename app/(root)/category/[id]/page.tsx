import LinkedText from "@/components/others/LinkedText";
import { getCategoryPostsAction } from "@/actions/category.action";
import { buildCategoryFeedQuery } from "@/lib/utils/categoryFeed";
import { getAuthHeaders } from "@/lib/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getLanguagesAction,
  getProfessionsAction,
} from "@/actions/utils.action";
import { ExploreBgCarousel, ExploreSearchSection } from "@/components/widgets";
import { EXPLORE_BG_IMAGES } from "@/constants";
import { getNameOfCategory } from "@/lib/utils/ReactElementUtils";
import Feed from "./feed";

const TagPage = async ({ params, searchParams }: any) => {
  if (!/^[a-f\d]{24}$/i.test(params.id)) notFound();
  await getAuthHeaders();
  const [categoryData, langData, professionData] = await Promise.all([
    getNameOfCategory(params.id),
    getLanguagesAction(),
    getProfessionsAction(),
  ]);
  if (!categoryData) notFound();
  let query;
  try {
    query = buildCategoryFeedQuery(params.id, searchParams || {});
  } catch {
    return (
      <section className="p-8 text-light-900">
        <h1>Invalid category filters</h1>
        <Link href={`/category/${params.id}`} className="text-primary-500">
          Clear filters
        </Link>
      </section>
    );
  }
  const posts = await getCategoryPostsAction(query, 1);
  if (!Array.isArray(posts)) throw new Error(posts.message);
  return (
    <main className="flex w-full flex-col items-center justify-center">
      <header className="sticky top-14 w-full">
        <div className="flex-center relative -mt-10 h-[26rem] w-full flex-col gap-2">
          <div className="flex-center z-20 gap-4 fill-light-800 text-4xl font-semibold text-light-800">
            {categoryData?.icon && (
              <categoryData.icon width="48px" height="48px" />
            )}
            {categoryData?.name}
          </div>
          <p className="z-20 pb-3 pt-1 text-sm text-light-700">
            <LinkedText text={categoryData?.description} />
          </p>
          <ExploreSearchSection
            langData={langData}
            professionData={professionData}
          />
          <div className="theme-page-gradient absolute left-0 top-0 z-10 size-full" />
          <ExploreBgCarousel slides={EXPLORE_BG_IMAGES} />
        </div>
      </header>
      <section className="z-30 -mt-5 w-full rounded-t-[30px] bg-dark-200 p-8 backdrop-blur-[80px]">
        <Feed initialPosts={posts} query={query} />
      </section>
    </main>
  );
};

export default TagPage;
