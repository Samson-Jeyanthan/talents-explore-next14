"use client";

import { DialogClose, DialogContent, DialogTitle } from "../ui/dialog";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import LoadFollowerList from "../others/LoadFollowerList";
import LoadFollowingList from "../others/LoadFollowingList";
import LoadProfileRatingList from "../others/LoadProfileRatingList";
import { connectionTabs } from "@/lib/utils/connections";

export default function ConnectionListModal({
  isTalent,
  currentTab,
  onClick,
  setCuurentTab,
  canViewRatings = true,
  canViewFollowers = true,
  canViewFollowings = true,
}: {
  isTalent: boolean;
  currentTab?: number;
  onClick: () => void;
  setCuurentTab?: (currentTab: number) => void;
  canViewRatings?: boolean;
  canViewFollowers?: boolean;
  canViewFollowings?: boolean;
}) {
  const [selected, setSelected] = useState(currentTab ?? 0);
  useEffect(() => {
    setSelected(currentTab ?? 0);
  }, [currentTab]);
  const tabs = connectionTabs(
    isTalent,
    canViewRatings,
    canViewFollowers,
    canViewFollowings,
  );
  const safeTab = tabs.some((tab) => tab.id === selected)
    ? selected
    : tabs[0]?.id;
  return (
    <DialogContent
      className="connection-modal-content"
      aria-describedby={undefined}
    >
      <div className="relative w-full shrink-0 px-4 pt-4">
        <DialogTitle className="pr-10 text-base font-semibold text-light-900">
          Connections
        </DialogTitle>
        <DialogClose
          aria-label="Close connection lists"
          className="absolute right-3 top-3 rounded-full p-2 text-light-900 hover:bg-dark-300"
          onClick={onClick}
        >
          <X className="size-4" />
        </DialogClose>
        <nav aria-label="Connection lists" className="mt-2 flex w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={safeTab === tab.id}
              className={`default-connection-tab ${safeTab === tab.id ? "active-connection-tab" : "text-light-600"}`}
              onClick={() => {
                setSelected(tab.id);
                setCuurentTab?.(tab.id);
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto p-4">
        {safeTab === 0 && <LoadProfileRatingList />}
        {safeTab === 1 && <LoadFollowerList />}
        {safeTab === 2 && <LoadFollowingList />}
        {safeTab === undefined && (
          <p className="rounded-xl border border-dark-400 p-4 text-center text-sm text-light-500">
            This account&apos;s connection lists are private.
          </p>
        )}
      </div>
    </DialogContent>
  );
}
