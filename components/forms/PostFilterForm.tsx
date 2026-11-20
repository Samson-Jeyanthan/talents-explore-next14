"use client";
import ExploreFilters from "@/components/widgets/explore/ExploreFilters";

export default function PostFilterForm({
  onClose,
}: {
  langData?: any;
  onClose: () => void;
}) {
  return <ExploreFilters type="FEED" onClose={onClose} />;
}
