"use client";

import { getCollaborationListAction } from "@/actions/collaboration.action";
import {
  getSkillsAction,
  getStatesAction,
  getSubCategoriesAction,
} from "@/actions/utils.action";
import CollaborationCard from "./CollaborationCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GENDER_VALUES, LEVEL_VALUES, TIME_DURATION_FILTERS } from "@/constants";
import { Filter, Search, Sparkles } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

type CollaborationTabType =
  | "ALL"
  | "COMMITTED"
  | "RECEIVED"
  | "MY"
  | "APPLIED";

type FilterState = {
  keywords: string;
  mainCategoryId: string;
  subCategoryId: string;
  skillId: string;
  level: string;
  gender: string;
  languageId: string;
  ethnicId: string;
  country: string;
  state: string;
  city: string;
  resultTime: string;
};

type Props = {
  currentUser: any;
  initialLists: Record<CollaborationTabType, any[]>;
  lookupData: {
    mainCategories: any[];
    languages: any[];
    countries: any[];
    ethnicities: any[];
  };
};

const PAGE_SIZE = 20;
const TABS: { key: CollaborationTabType; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "COMMITTED", label: "Committed" },
  { key: "RECEIVED", label: "Received Invites" },
  { key: "MY", label: "My Collab" },
  { key: "APPLIED", label: "Applied" },
];

const EMPTY_FILTERS: FilterState = {
  keywords: "",
  mainCategoryId: "",
  subCategoryId: "",
  skillId: "",
  level: "",
  gender: "",
  languageId: "",
  ethnicId: "",
  country: "",
  state: "",
  city: "",
  resultTime: "",
};

function mergeByCollaborationId(current: any[], next: any[]) {
  const map = new Map<string, any>();

  [...current, ...next].forEach((item) => {
    const key = item?.collaboration?._id || item?.collaboration?.id || item?._id;
    if (key) {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
}

function toOptions(items: any[], valueKey: string, labelKeys: string[]) {
  return items
    .map((item) => {
      const value = item?.[valueKey] || item?._id || item?.id || item?.value || item?.name;
      const label =
        labelKeys.map((key) => item?.[key]).find(Boolean) ||
        item?.name ||
        item?.label ||
        value;

      return value && label ? { value: String(value), label: String(label) } : null;
    })
    .filter(Boolean) as { value: string; label: string }[];
}

function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="h-11 rounded-2xl border-dark-300 bg-dark-200 text-light-900">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="border-dark-300 bg-dark-250 text-light-900">
        {options.map((option) => (
          <SelectItem key={`${placeholder}-${option.value}`} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CollaborationDashboard({ currentUser, initialLists, lookupData }: Props) {
  const [activeTab, setActiveTab] = useState<CollaborationTabType>("ALL");
  const [isPending, startTransition] = useTransition();
  const [lists, setLists] = useState(initialLists);
  const [pages, setPages] = useState<Record<CollaborationTabType, number>>({
    ALL: 1,
    COMMITTED: 1,
    RECEIVED: 1,
    MY: 1,
    APPLIED: 1,
  });
  const [hasMore, setHasMore] = useState<Record<CollaborationTabType, boolean>>({
    ALL: (initialLists.ALL || []).length >= PAGE_SIZE,
    COMMITTED: (initialLists.COMMITTED || []).length >= PAGE_SIZE,
    RECEIVED: (initialLists.RECEIVED || []).length >= PAGE_SIZE,
    MY: (initialLists.MY || []).length >= PAGE_SIZE,
    APPLIED: (initialLists.APPLIED || []).length >= PAGE_SIZE,
  });
  const [filtersByTab, setFiltersByTab] = useState<Record<CollaborationTabType, FilterState>>({
    ALL: { ...EMPTY_FILTERS },
    COMMITTED: { ...EMPTY_FILTERS },
    RECEIVED: { ...EMPTY_FILTERS },
    MY: { ...EMPTY_FILTERS },
    APPLIED: { ...EMPTY_FILTERS },
  });
  const [showFilters, setShowFilters] = useState(false);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);

  const activeFilters = filtersByTab[activeTab];
  const activeList = lists[activeTab] || [];

  const mainCategoryOptions = toOptions(
    lookupData.mainCategories,
    "_id",
    ["name", "mainCategory"]
  );
  const languageOptions = toOptions(lookupData.languages, "_id", ["language", "name"]);
  const countryOptions = toOptions(lookupData.countries, "name", ["name", "country"]);
  const ethnicOptions = toOptions(lookupData.ethnicities, "_id", ["ethnic", "name"]);
  const subCategoryOptions = toOptions(subCategories, "_id", ["name", "subCategory"]);
  const skillOptions = toOptions(skills, "_id", ["name", "skill"]);
  const stateOptions = toOptions(states, "name", ["name", "state"]);
  const levelOptions = LEVEL_VALUES.map((item) => ({
    value: item._id,
    label: item.name,
  }));
  const genderOptions = GENDER_VALUES.map((item) => ({
    value: item.id,
    label: item.name,
  }));
  const durationOptions = TIME_DURATION_FILTERS.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  useEffect(() => {
    let active = true;

    async function loadDependentOptions() {
      if (activeFilters.mainCategoryId) {
        const response = await getSubCategoriesAction(activeFilters.mainCategoryId);
        if (active) {
          setSubCategories(response?.response || []);
        }
      } else if (active) {
        setSubCategories([]);
      }

      if (activeFilters.subCategoryId) {
        const response = await getSkillsAction(activeFilters.subCategoryId);
        if (active) {
          setSkills(response?.response || []);
        }
      } else if (active) {
        setSkills([]);
      }

      if (activeFilters.country) {
        const response = await getStatesAction(activeFilters.country);
        if (active) {
          setStates(response?.response || []);
        }
      } else if (active) {
        setStates([]);
      }
    }

    loadDependentOptions();

    return () => {
      active = false;
    };
  }, [activeFilters.country, activeFilters.mainCategoryId, activeFilters.subCategoryId]);

  const fetchTab = (tab: CollaborationTabType, pageNo = 1, append = false) => {
    startTransition(async () => {
      const response = await getCollaborationListAction({
        type: tab,
        pageNo,
        pageSize: PAGE_SIZE,
        filters: filtersByTab[tab],
      });

      if (response.status !== "7400") {
        if (!append) {
          setLists((prev) => ({ ...prev, [tab]: [] }));
        }
        setHasMore((prev) => ({ ...prev, [tab]: false }));
        if (response.message) {
          toast.error(response.message);
        }
        return;
      }

      const nextItems = Array.isArray(response.response) ? response.response : [];

      setLists((prev) => ({
        ...prev,
        [tab]: append ? mergeByCollaborationId(prev[tab] || [], nextItems) : nextItems,
      }));
      setPages((prev) => ({ ...prev, [tab]: pageNo }));
      setHasMore((prev) => ({ ...prev, [tab]: nextItems.length >= PAGE_SIZE }));
    });
  };

  const updateFilter = (field: keyof FilterState, value: string) => {
    setFiltersByTab((prev) => {
      const nextFilters = {
        ...prev[activeTab],
        [field]: value,
      };

      if (field === "mainCategoryId") {
        nextFilters.subCategoryId = "";
        nextFilters.skillId = "";
      }

      if (field === "subCategoryId") {
        nextFilters.skillId = "";
      }

      if (field === "country") {
        nextFilters.state = "";
      }

      return {
        ...prev,
        [activeTab]: nextFilters,
      };
    });
  };

  const resetFilters = () => {
    setFiltersByTab((prev) => ({
      ...prev,
      [activeTab]: { ...EMPTY_FILTERS },
    }));
    setSubCategories([]);
    setSkills([]);
    setStates([]);
    setTimeout(() => fetchTab(activeTab, 1, false), 0);
  };

  const loadMore = () => {
    fetchTab(activeTab, pages[activeTab] + 1, true);
  };

  return (
    <section className="flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="rounded-[32px] border border-dark-300 bg-dark-250 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary-500" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-light-500">
                Collaboration
              </p>
            </div>
            <h1 className="pt-2 text-3xl font-semibold text-light-900">Build together</h1>
            <p className="pt-2 text-sm text-light-500">
              Open projects, received invites, my collaborations, and applied roles in one place.
            </p>
          </div>

          <div className="rounded-[26px] border border-dark-300 bg-dark-200 px-4 py-3 text-sm text-light-500">
            Signed in as{" "}
            <span className="font-semibold text-light-900">
              {currentUser?.userName || currentUser?.email || "current user"}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = (lists[tab.key] || []).length;

            return (
              <Button
                key={tab.key}
                type="button"
                className={`rounded-full px-4 ${
                  isActive
                    ? "bg-primary-500 text-light-900"
                    : "bg-dark-200 text-light-500 hover:text-light-900"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {count > 0 ? (
                  <span className="ml-2 rounded-full bg-dark-100 px-2 py-0.5 text-[10px] text-light-900">
                    {count}
                  </span>
                ) : null}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[32px] border border-dark-300 bg-dark-250 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-light-500" />
            <Input
              value={activeFilters.keywords}
              onChange={(event) => updateFilter("keywords", event.target.value)}
              placeholder="Search collaborations"
              className="h-12 rounded-full border-dark-300 bg-dark-200 pl-11 text-light-900 placeholder:text-light-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(activeTab === "ALL" || activeTab === "MY") ? (
              <Button
                type="button"
                className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
                onClick={() => window.location.assign("/collaboration/create")}
              >
                New Collaboration
              </Button>
            ) : null}
            <Button
              type="button"
              className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
              onClick={() => setShowFilters((prev) => !prev)}
            >
              <Filter className="mr-2 size-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button
              type="button"
              disabled={isPending}
              className="rounded-full bg-primary-500 text-light-900"
              onClick={() => fetchTab(activeTab, 1, false)}
            >
              {isPending ? "Loading..." : "Apply Search"}
            </Button>
          </div>
        </div>

        {showFilters ? (
          <div className="mt-4 grid gap-3 rounded-[28px] border border-dark-300 bg-dark-200 p-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterSelect
              value={activeFilters.mainCategoryId}
              placeholder="Main category"
              options={mainCategoryOptions}
              onChange={(value) => updateFilter("mainCategoryId", value)}
            />
            <FilterSelect
              value={activeFilters.subCategoryId}
              placeholder="Sub category"
              options={subCategoryOptions}
              onChange={(value) => updateFilter("subCategoryId", value)}
            />
            <FilterSelect
              value={activeFilters.skillId}
              placeholder="Skill"
              options={skillOptions}
              onChange={(value) => updateFilter("skillId", value)}
            />
            <FilterSelect
              value={activeFilters.level}
              placeholder="Level"
              options={levelOptions}
              onChange={(value) => updateFilter("level", value)}
            />
            <FilterSelect
              value={activeFilters.gender}
              placeholder="Gender"
              options={genderOptions}
              onChange={(value) => updateFilter("gender", value)}
            />
            <FilterSelect
              value={activeFilters.languageId}
              placeholder="Language"
              options={languageOptions}
              onChange={(value) => updateFilter("languageId", value)}
            />
            <FilterSelect
              value={activeFilters.ethnicId}
              placeholder="Ethnicity"
              options={ethnicOptions}
              onChange={(value) => updateFilter("ethnicId", value)}
            />
            <FilterSelect
              value={activeFilters.country}
              placeholder="Country"
              options={countryOptions}
              onChange={(value) => updateFilter("country", value)}
            />
            <FilterSelect
              value={activeFilters.state}
              placeholder="State"
              options={stateOptions}
              onChange={(value) => updateFilter("state", value)}
            />
            <FilterSelect
              value={activeFilters.resultTime}
              placeholder="Result time"
              options={durationOptions}
              onChange={(value) => updateFilter("resultTime", value)}
            />
            <Input
              value={activeFilters.city}
              onChange={(event) => updateFilter("city", event.target.value)}
              placeholder="City"
              className="h-11 rounded-2xl border-dark-300 bg-dark-200 text-light-900 placeholder:text-light-500"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                disabled={isPending}
                className="rounded-full bg-primary-500 text-light-900"
                onClick={() => fetchTab(activeTab, 1, false)}
              >
                Apply
              </Button>
              <Button
                type="button"
                className="rounded-full bg-dark-250 text-light-900 hover:bg-dark-300"
                onClick={resetFilters}
              >
                Reset
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {activeTab === "RECEIVED" || activeTab === "APPLIED" ? (
        <div className="rounded-[26px] border border-dark-300 bg-dark-250 px-5 py-4 text-sm text-light-500">
          {activeTab === "RECEIVED"
            ? "Explore the invitations you've received from people who want your talent in their collaboration."
            : "Here are the collaborations you applied for on your own initiative."}
        </div>
      ) : null}

      <div className="grid gap-4">
        {activeList.map((item) => (
          <CollaborationCard
            key={item?.collaboration?._id || item?.collaboration?.id || item?._id}
            collaboration={item}
          />
        ))}

        {activeList.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-dark-300 bg-dark-250 px-4 py-12 text-center text-sm text-light-500">
            {isPending ? "Loading collaborations..." : "No collaborations found."}
          </div>
        ) : null}

        {activeList.length > 0 && hasMore[activeTab] ? (
          <Button
            type="button"
            disabled={isPending}
            className="mx-auto rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
            onClick={loadMore}
          >
            {isPending ? "Loading..." : "Load More"}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export default CollaborationDashboard;
