import { searchAction } from "@/actions/search.action";
import { getMainCategoriesAction } from "@/actions/utils.action";
import {
  ExploreCategories,
  ExploreTopPosts,
  ExploreTopTalents,
} from "@/components/widgets";
import { getSession } from "@/lib/session";
import { ISearchParamsProps } from "@/types/utils.types";

async function page({ searchParams }: ISearchParamsProps) {
  const token = await getSession();

  if (!token) {
    return null;
  }

  console.log(searchParams, "searchParams");

  // search function in the explore
  const searchData = await searchAction({
    searchType: "ALL",
    userId: token,
    viewUserId: token,
    pageNo: 1,
    pageSize: 12,
    searchText: searchParams?.q,
    resultTime: searchParams?.timeDuration,
    publicRating: Number(searchParams?.postRating),
  });

  // default data display function in the explore
  const mainCategoriesData: any = await getMainCategoriesAction();
  const topTalentsData = await searchAction({
    searchType: "TALENT",
    userId: token,
    viewUserId: token,
    pageNo: 1,
    pageSize: 12,
    userRating: 4.5,
  });
  const topPostsData = await searchAction({
    searchType: "FEED",
    userId: token,
    viewUserId: token,
    pageNo: 1,
    pageSize: 12,
    publicRating: 4.5,
  });

  return (
    <div className="flex flex-col gap-8">
      {searchParams && Object.keys(searchParams).length > 0 ? (
        <div className="flex flex-col gap-4">
          {searchParams?.q && (
            <h1 className="text-2xl font-semibold text-light-900">
              Showing results for &quot;{searchParams?.q}&quot;
            </h1>
          )}
          <ExploreTopPosts data={searchData.response} />
        </div>
      ) : (
        <>
          <ExploreCategories data={mainCategoriesData.response} />
          <ExploreTopPosts data={topPostsData.response} />
          <ExploreTopTalents data={topTalentsData.response} />
        </>
      )}
    </div>
  );
}

export default page;
