import ExploreResultsPage from "@/components/widgets/explore/ExploreResultsPage";
import type { ISearchParamsProps } from "@/types/utils.types";

export default function Page({ searchParams }: ISearchParamsProps) {
  return (
    <ExploreResultsPage
      type="SHARE"
      searchParams={searchParams}
      path="/explore/shared"
    />
  );
}
