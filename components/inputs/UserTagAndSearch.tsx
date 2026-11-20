"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useUserContext } from "@/context/AuthProvider";
import UserProfileImg from "../others/UserProfileImg";
import { CiSearch } from "react-icons/ci";
import { X } from "lucide-react";
import {
  usePeopleSearch,
  type PeopleResult,
} from "@/lib/hooks/usePeopleSearch";

export default function UserTagAndSearch({
  isTag,
  isCreditTag,
  fieldChange,
  values,
}: {
  isTag: boolean;
  isCreditTag?: boolean;
  fieldChange?: any;
  values?: any;
}) {
  const { user } = useUserContext();
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const [tagged, setTagged] = useState<PeopleResult[]>(
    Array.isArray(values) ? values : [],
  );
  const result = usePeopleSearch(query, user?.currentUserId);
  useEffect(() => {
    if (Array.isArray(values)) setTagged(values);
  }, [values]);
  useEffect(() => {
    setActive(-1);
  }, [query, result.items]);
  const items =
    isTag && !isCreditTag
      ? result.items.filter(
          (item) => !tagged.some((tag) => tag._id === item._id),
        )
      : result.items;
  const show = focused && !!query.trim();
  function select(item: PeopleResult) {
    if (isTag) {
      const tag = {
        _id: item._id,
        firstName: item.firstName,
        lastName: item.lastName,
        profileImage: item.profileImage,
      };
      if (isCreditTag) fieldChange?.(tag);
      else {
        const next = [
          ...tagged.filter((person) => person._id !== item._id),
          tag as PeopleResult,
        ];
        setTagged(next);
        fieldChange?.(next);
      }
    } else
      router.push(`/profile/${encodeURIComponent(item.userName)}/${item._id}`);
    setQuery("");
    setActive(-1);
  }
  return (
    <div
      className={`relative flex min-w-0 flex-col gap-2 ${isTag ? "w-full" : "w-full max-w-[22rem]"}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          setFocused(false);
      }}
    >
      {isTag && !isCreditTag && tagged.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tagged.map((person) => (
            <span
              key={person._id}
              className="flex max-w-full items-center gap-2 rounded-full bg-dark-300 px-3 py-1 text-xs text-light-700"
            >
              <span className="truncate">
                {person.firstName} {person.lastName}
              </span>
              <button
                type="button"
                aria-label={`Remove tag for ${person.firstName}`}
                className="rounded-full p-1"
                onClick={() => {
                  const next = tagged.filter((item) => item._id !== person._id);
                  setTagged(next);
                  fieldChange?.(next);
                }}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative min-w-0">
        {!isTag && (
          <CiSearch className="pointer-events-none absolute left-2 top-2 text-2xl text-light-500" />
        )}
        <Input
          role="combobox"
          aria-label={isTag ? "Find people to tag" : "Search for users"}
          aria-autocomplete="list"
          aria-expanded={show}
          aria-controls={listId}
          aria-activedescendant={
            show && active >= 0 && items[active]
              ? `${listId}-${active}`
              : undefined
          }
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setFocused(true);
          }}
          onFocus={() => setFocused(true)}
          placeholder={isTag ? "Tag people" : "Search for users"}
          className={isTag ? "shad-form-input w-full" : "shad-nav-search-input"}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setFocused(false);
              setActive(-1);
              return;
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setFocused(true);
              if (items.length)
                setActive((current) =>
                  event.key === "ArrowDown"
                    ? (current + 1) % items.length
                    : current <= 0
                      ? items.length - 1
                      : current - 1,
                );
            }
            if (event.key === "Enter" && show) {
              event.preventDefault();
              const item = items[active >= 0 ? active : 0];
              if (item) select(item);
            }
          }}
        />
      </div>
      {show && (
        <div className="absolute left-0 top-full z-[120] mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-dark-400 bg-dark-250 p-1 shadow-lg">
          {result.loading && (
            <p role="status" className="p-3 text-xs text-light-500">
              Searching users...
            </p>
          )}
          {result.error && (
            <div role="alert" className="p-3 text-xs text-light-700">
              <p>{result.error}</p>
              <button
                type="button"
                className="mt-2 underline"
                onClick={result.retry}
              >
                Try again
              </button>
            </div>
          )}
          {!result.loading && !result.error && !items.length && (
            <p role="status" className="p-3 text-xs text-light-500">
              No users found.
            </p>
          )}
          <div id={listId} role="listbox" aria-label="Matching users">
            {items.map((item, index) => {
              const content = (
                <>
                  <UserProfileImg
                    userName={item.firstName}
                    src={item.profileImage}
                    className="!size-8 !min-h-8 !min-w-8"
                  />
                  <span className="min-w-0 truncate">
                    {item.firstName} {item.lastName}
                  </span>
                </>
              );
              const className = `flex w-full items-center gap-2 rounded-lg p-2 text-left text-xs text-light-700 hover:bg-dark-300 ${active === index ? "bg-dark-300" : ""}`;
              return isTag ? (
                <button
                  key={item._id}
                  id={`${listId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={active === index}
                  className={className}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => select(item)}
                >
                  {content}
                </button>
              ) : (
                <Link
                  key={item._id}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={active === index}
                  href={`/profile/${encodeURIComponent(item.userName)}/${item._id}`}
                  className={className}
                  onClick={() => {
                    setQuery("");
                    setFocused(false);
                  }}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
