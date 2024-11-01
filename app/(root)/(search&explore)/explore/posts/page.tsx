import { searchAction } from "@/actions/search.action";
import { ExplorePostCard } from "@/components/cards";
import { getSession } from "@/lib/session";
import { ISearchParamsProps } from "@/types/utils.types";

async function Posts({ searchParams }: ISearchParamsProps) {
  const token = await getSession();
  if (!token) {
    return null;
  }

  const postsData = await searchAction({
    searchType: "FEED",
    userId: token,
    viewUserId: token,
    pageNo: 1,
    pageSize: 20,
    searchText: searchParams?.q,
    resultTime: searchParams?.timeDuration,
    publicRating: Number(searchParams?.publicRating),
  });

  return (
    <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-7">
      {postsData.response.map((post: any, index: number) => (
        <ExplorePostCard key={index} postCard={post} index={index} />
      ))}
    </div>
  );
}

export default Posts;
