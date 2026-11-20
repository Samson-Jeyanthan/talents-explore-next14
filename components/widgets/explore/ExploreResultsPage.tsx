import Link from "next/link";
import ExploreResults from "./ExploreResults";
import {
  buildExploreQuery,
  paramsString,
  clearExploreFilters,
  type ExploreType,
} from "@/lib/utils/explore";

export default function ExploreResultsPage({
  type,
  searchParams,
  path,
}: {
  type: ExploreType;
  searchParams: Record<string, string | string[] | undefined>;
  path: string;
}) {
  const params = paramsString(searchParams);
  try {
    const query = buildExploreQuery(type, params);
    return <ExploreResults key={JSON.stringify(query)} query={query} />;
  } catch {
    const cleared = clearExploreFilters(params);
    return (
      <section
        role="alert"
        className="rounded-xl border border-dark-400 p-4 text-sm text-light-700"
      >
        <p>Some search filters are invalid. Clear them to continue.</p>
        <Link
          href={`${path}${cleared ? `?${cleared}` : ""}`}
          className="mt-3 inline-block text-primary-500 underline"
        >
          Clear filters
        </Link>
      </section>
    );
  }
}
