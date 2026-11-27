"use client";

import CollaborationCard from "./CollaborationCard";
import LookupSelect from "@/components/inputs/SearchLookupSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { useCollaborationLists } from "@/lib/hooks/useCollaborationLists";
import {
  emptyCollaborationFilters,
  collaborationFilterValidation,
  collaborationKey,
  type CollaborationTab,
  type CollaborationListResult,
} from "@/lib/utils/collaboration";
import {
  GENDER_VALUES,
  LEVEL_VALUES,
  TIME_DURATION_FILTERS,
} from "@/constants";

const TABS: { key: CollaborationTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "COMMITTED", label: "Committed" },
  { key: "RECEIVED", label: "Received Invites" },
  { key: "MY", label: "My Collab" },
  { key: "APPLIED", label: "Applied" },
];
type FilterState = ReturnType<typeof emptyCollaborationFilters>;
type Props = { currentUser: any; initialResult: CollaborationListResult };

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="text-sm text-light-700">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="shad-form-input w-full"
      >
        <option value="">Any {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function CollaborationDashboard({
  currentUser,
  initialResult,
}: Props) {
  const [activeTab, setActiveTab] = useState<CollaborationTab>("ALL");
  const [drafts, setDrafts] = useState<Record<CollaborationTab, FilterState>>(
    () =>
      Object.fromEntries(
        TABS.map((tab) => [tab.key, emptyCollaborationFilters()]),
      ) as Record<CollaborationTab, FilterState>,
  );
  const [showFilters, setShowFilters] = useState(false);
  const filterToggle = useRef<HTMLButtonElement>(null);
  const filterPanelId = useId();
  const [filterError, setFilterError] = useState("");
  const inbox = useCollaborationLists(initialResult);
  const state = inbox.tabs[activeTab];
  const draft = drafts[activeTab];
  const draftChanged = Object.keys(draft).some(
    (key) =>
      draft[key as keyof FilterState].trim() !==
      String((state.filters as any)[key] || "").trim(),
  );
  function update(key: keyof FilterState, value: string) {
    setDrafts((current) => ({
      ...current,
      [activeTab]: {
        ...current[activeTab],
        [key]: value,
        ...(key === "mainCategoryId"
          ? { subCategoryId: "", skillId: "", level: "" }
          : {}),
        ...(key === "subCategoryId" ? { skillId: "", level: "" } : {}),
        ...(key === "country" ? { state: "", city: "" } : {}),
      },
    }));
  }
  function apply(event: FormEvent) {
    event.preventDefault();
    const parsed = collaborationFilterValidation.safeParse(draft);
    if (!parsed.success) {
      setFilterError("Check your filter selections or reset the filters.");
      return;
    }
    setFilterError("");
    if (showFilters) closeFilters();
    return inbox.apply(activeTab, parsed.data);
  }
  function closeFilters() {
    setShowFilters(false);
    filterToggle.current?.focus();
  }
  function reset() {
    const empty = emptyCollaborationFilters();
    setDrafts((current) => ({ ...current, [activeTab]: empty }));
    setFilterError("");
    return inbox.apply(activeTab, {});
  }
  function select(tab: CollaborationTab) {
    setFilterError("");
    setActiveTab(tab);
    inbox.ensure(tab);
  }
  return (
    <section className="flex w-full min-w-0 max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6">
      <header className="rounded-3xl border border-dark-400/50 bg-dark-250 p-5 sm:p-6">
        <h1 className="text-3xl font-semibold text-light-900">
          Build together
        </h1>
        <p className="mt-2 text-sm text-light-600">
          Explore projects, invitations and your collaborations.
        </p>
        <p className="mt-2 text-xs text-light-500">
          Signed in as{" "}
          <span className="font-medium text-light-900">
            {currentUser?.userName || "you"}
          </span>
        </p>
        <nav
          aria-label="Collaboration lists"
          className="mt-5 flex flex-wrap gap-2"
        >
          {TABS.map((tab) => (
            <Button
              key={tab.key}
              type="button"
              aria-pressed={activeTab === tab.key}
              onClick={() => select(tab.key)}
              className={`rounded-full px-4 ${activeTab === tab.key ? "bg-primary-500 text-white" : "bg-dark-300 text-light-700"}`}
            >
              {tab.label}
            </Button>
          ))}
        </nav>
      </header>
      <form
        onSubmit={apply}
        className="rounded-3xl border border-dark-400/50 bg-dark-250 p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Input
            aria-label="Search collaborations"
            value={draft.keywords}
            onChange={(event) => update("keywords", event.target.value)}
            placeholder="Search collaborations"
            className="shad-form-input w-full min-w-0 basis-full sm:flex-1 sm:basis-64"
          />
          <Button
            type="submit"
            disabled={state.loading && !draftChanged}
            className="shad-button_primary rounded-full"
          >
            Apply Search
          </Button>
          <Button
            type="button"
            ref={filterToggle}
            onClick={() => setShowFilters((value) => !value)}
            aria-expanded={showFilters}
            aria-controls={filterPanelId}
            className="shad-button_secondary rounded-full"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <Button
            type="button"
            disabled={state.loading}
            onClick={() => inbox.refresh(activeTab)}
            className="shad-button_secondary rounded-full"
          >
            Refresh
          </Button>
          {(activeTab === "ALL" || activeTab === "MY") && (
            <Link
              href="/collaboration/create"
              className="shad-button_secondary rounded-full px-4 py-2 text-sm"
            >
              New Collaboration
            </Link>
          )}
        </div>
        {draftChanged && (
          <p className="mt-3 text-xs text-light-500">
            Filters changed. Apply Search to update the results.
          </p>
        )}
        {showFilters && (
          <div id={filterPanelId} className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2 lg:col-span-3">
              <h2 className="text-lg font-semibold text-light-900">Search filters</h2>
              <Button type="button" onClick={closeFilters} className="shad-button_secondary">
                Back to results
              </Button>
            </div>
            <LookupSelect
              key={`category-${activeTab}`}
              label="Main category"
              kind="categories"
              value={draft.mainCategoryId}
              onChange={(value) => update("mainCategoryId", value)}
            />
            <LookupSelect
              key={`subcategory-${activeTab}`}
              label="Subcategory"
              kind="subcategories"
              parent={draft.mainCategoryId}
              value={draft.subCategoryId}
              onChange={(value) => update("subCategoryId", value)}
            />
            <LookupSelect
              key={`skill-${activeTab}`}
              label="Skill"
              kind="skills"
              parent={draft.subCategoryId}
              value={draft.skillId}
              onChange={(value) => update("skillId", value)}
            />
            <FilterSelect
              label="Level"
              value={draft.level}
              options={LEVEL_VALUES.map((item) => ({
                value: item._id,
                label: item.name,
              }))}
              onChange={(value) => update("level", value)}
            />
            <FilterSelect
              label="Gender"
              value={draft.gender}
              options={GENDER_VALUES.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onChange={(value) => update("gender", value)}
            />
            <LookupSelect
              label="Language"
              kind="languages"
              value={draft.languageId}
              onChange={(value) => update("languageId", value)}
            />
            <LookupSelect
              label="Ethnicity"
              kind="ethnic"
              value={draft.ethnicId}
              onChange={(value) => update("ethnicId", value)}
            />
            <LookupSelect
              label="Country"
              kind="countries"
              value={draft.country}
              onChange={(value) => update("country", value)}
            />
            <LookupSelect
              key={`state-${activeTab}`}
              label="Town"
              kind="states"
              parent={draft.country}
              value={draft.state}
              onChange={(value) => update("state", value)}
            />
            <FilterSelect
              label="Published within"
              value={draft.resultTime}
              options={TIME_DURATION_FILTERS.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onChange={(value) => update("resultTime", value)}
            />
            <div className="flex flex-col gap-2">
              <label
                htmlFor="collaboration-city"
                className="text-sm text-light-700"
              >
                City
              </label>
              <Input
                id="collaboration-city"
                value={draft.city}
                onChange={(event) => update("city", event.target.value)}
                className="shad-form-input w-full"
              />
            </div>
            <div className="flex flex-wrap gap-3 border-t border-dark-300 pt-4 sm:col-span-2 lg:col-span-3">
              <Button type="button" onClick={closeFilters} className="shad-button_secondary">
                Back to results
              </Button>
              <Button type="submit" disabled={state.loading && !draftChanged} className="shad-button_primary">
                Apply filters
              </Button>
            </div>
          </div>
        )}
        {filterError && (
          <p role="alert" className="mt-3 text-sm text-primary-500">
            {filterError}
          </p>
        )}
        <Button
          type="button"
          onClick={reset}
          className="mt-4 text-sm text-light-600 underline"
          variant="ghost"
        >
          Reset filters
        </Button>
      </form>
      {(activeTab === "RECEIVED" || activeTab === "APPLIED") && (
        <p className="rounded-2xl border border-dark-400/50 bg-dark-250 p-4 text-sm text-light-600">
          {activeTab === "RECEIVED"
            ? "Invitations you have received to join collaborations."
            : "Collaborations you have applied to join."}
        </p>
      )}
      <div className="grid min-w-0 gap-4" aria-busy={state.loading}>
        {state.items.map((item) => (
          <CollaborationCard
            key={collaborationKey(item)}
            collaboration={item}
          />
        ))}
        {state.loading && (
          <p role="status" className="py-5 text-center text-sm text-light-500">
            Loading collaborations...
          </p>
        )}
        {state.error && (
          <div
            role="alert"
            className="rounded-2xl border border-dark-400 bg-dark-250 p-5 text-sm text-light-700"
          >
            <p>{state.error}</p>
            <Button
              type="button"
              disabled={state.loading}
              onClick={() => inbox.load(activeTab)}
              className="shad-button_secondary mt-3"
            >
              Try again
            </Button>
          </div>
        )}
        {!state.loading &&
          !state.error &&
          state.loaded &&
          !state.items.length && (
            <p className="rounded-2xl border border-dashed border-dark-400 bg-dark-250 p-8 text-center text-sm text-light-500">
              No collaborations found. Try another search or reset your filters.
            </p>
          )}
        {!state.loading && !state.error && state.loaded && state.hasMore && (
          <Button
            type="button"
            onClick={() => inbox.load(activeTab)}
            className="shad-button_secondary mx-auto rounded-full"
          >
            Load More
          </Button>
        )}
      </div>
    </section>
  );
}
