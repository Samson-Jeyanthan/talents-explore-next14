import { exploreAllTalentsAction } from "@/actions/search.action";
import { getSession } from "@/lib/session";
import { ISearchParamsProps } from "@/types/utils.types";

async function Talents({ searchParams }: ISearchParamsProps) {
  const token = await getSession();

  if (!token) {
    return null;
  }

  const allTalentsData = await exploreAllTalentsAction({
    userId: token,
    pageNo: 1,
    pageSize: 14,
    searchText: searchParams?.q,
  });

  if (allTalentsData.status === 400) {
    return <div>{allTalentsData.message}</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-7">
      {allTalentsData}
    </div>
  );
}

export default Talents;
