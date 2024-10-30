import {
  getLanguagesAction,
  getProfessionsAction,
} from "@/actions/utils.action";
import { ExploreBgCarousel, ExploreSearchSection } from "@/components/widgets";
import { EXPLORE_BG_IMAGES } from "@/constants";
import { getNameOfCategory } from "@/lib/utils/ReactElementUtils";

const TagPage = async ({ params }: { params: { id: string } }) => {
  const categoryData = await getNameOfCategory(params.id);
  const langData = await getLanguagesAction();
  const professionData = await getProfessionsAction();
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
            {categoryData?.description}
          </p>
          <ExploreSearchSection
            langData={langData}
            professionData={professionData}
          />
          <div className="absolute left-0 top-0 z-10 size-full bg-gradient-to-b from-[rgb(17,19,27,0.0)] to-[rgba(0,0,0)]" />
          <ExploreBgCarousel slides={EXPLORE_BG_IMAGES} />
        </div>
      </header>
      <section className="z-30 -mt-5 w-full rounded-t-[30px] bg-dark-200 p-8 backdrop-blur-[80px]">
        posts
      </section>
    </main>
  );
};

export default TagPage;
