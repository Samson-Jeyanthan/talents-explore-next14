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
    pageSize: 5,
  });

  return (
    <>
      <ExploreCategories data={mainCategoriesData.response} />
      <ExploreTopTalents data={topTalentsData.response} />
    </>
  );
}

export default page;
