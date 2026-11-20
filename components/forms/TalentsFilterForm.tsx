"use client";
import ExploreFilters from "@/components/widgets/explore/ExploreFilters";

export default function TalentFilterForm({
  onClose,
}: {
  langData?: any;
  professionData?: any;
  onClose: () => void;
}) {
  return <ExploreFilters type="TALENT" onClose={onClose} />;
}
