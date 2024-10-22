import { getMainCategoriesAction, searchAction } from "@/actions/utils.action";
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
    pageSize: 10,
    userRating: 4,
  });

  return (
    <div className="flex flex-col gap-7">
      <ExploreCategories data={mainCategoriesData.response} />
      <ExploreTopTalents data={topTalentsData.response} />
    </div>
  );
}

export default page;
