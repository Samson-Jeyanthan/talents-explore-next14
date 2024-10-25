import { searchAction } from "@/actions/search.action";
import { getMainCategoriesAction } from "@/actions/utils.action";
import { ExploreCategories, ExploreTopTalents } from "@/components/widgets";
import { getSession } from "@/lib/session";

async function page() {
  const token = await getSession();

  if (!token) {
    return null;
  }
  const mainCategoriesData: any = await getMainCategoriesAction();
  const topTalentsData = await searchAction({
    searchType: "TALENT",
    userId: token,
    viewUserId: token,
    pageNo: 1,
    pageSize: 12,
    userRating: 4.5,
  });

  return (
    <div className="flex flex-col gap-8">
      <ExploreCategories data={mainCategoriesData.response} />
      <ExploreTopTalents data={topTalentsData.response} />
    </div>
  );
}

export default page;
