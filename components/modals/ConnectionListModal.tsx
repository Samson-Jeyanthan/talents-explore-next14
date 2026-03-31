"use client";

import { DialogClose, DialogContent, DialogTitle } from "../ui/dialog";
import { MdClose } from "react-icons/md";
import {
  LoadFollowerList,
  LoadFollowingList,
  LoadProfileRatingList,
} from "../others";

function ConnectionListModal({
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
  const safeTab = currentTab === 0 && !canViewRatings
    ? canViewFollowers
      ? 1
      : 2
    : currentTab === 1 && !canViewFollowers
      ? canViewFollowings
        ? 2
        : canViewRatings
          ? 0
          : undefined
      : currentTab === 2 && !canViewFollowings
        ? canViewRatings
          ? 0
          : canViewFollowers
            ? 1
            : undefined
        : currentTab;

  return (
    <DialogContent
      className="connection-modal-content"
      aria-describedby={undefined}
    >
      <DialogTitle className="sticky top-0 z-10 flex h-max w-full items-center justify-between rounded-2xl bg-dark-250 shadow-sm">
        {isTalent ? (
          <>
            {canViewRatings ? (
              <h3
                className={`${safeTab === 0 ? "active-connection-tab" : "text-light-600"} default-connection-tab`}
                onClick={() => setCuurentTab && setCuurentTab(0)}
              >
                Ratings
              </h3>
            ) : null}
            {canViewFollowers ? (
              <h3
                className={`${safeTab === 1 ? "active-connection-tab" : "text-light-600"} default-connection-tab`}
                onClick={() => setCuurentTab && setCuurentTab(1)}
              >
                Followers
              </h3>
            ) : null}
          </>
        ) : null}
        {canViewFollowings ? (
          <h3
            className={`${safeTab === 2 ? "active-connection-tab" : "text-light-600"} default-connection-tab`}
            onClick={() => setCuurentTab && setCuurentTab(2)}
          >
            Following
          </h3>
        ) : null}
      </DialogTitle>

      <div className="z-0 flex w-full flex-col items-center gap-4 overflow-y-scroll p-4">
        {isTalent ? (
          <>
            {safeTab === 0 && canViewRatings ? (
              <LoadProfileRatingList />
            ) : safeTab === 1 && canViewFollowers ? (
              <LoadFollowerList />
            ) : null}
          </>
        ) : null}
        {safeTab === 2 && canViewFollowings ? <LoadFollowingList /> : null}
        {safeTab === undefined ? (
          <div className="w-full rounded-2xl border border-dark-300 bg-dark-300/40 p-5 text-center text-sm text-light-500">
            This list is private for your current visibility level.
          </div>
        ) : null}
      </div>
      <DialogClose
        className="absolute -right-8 -top-8 cursor-pointer rounded-full bg-dark-250 p-[6px] text-light-900 focus:outline-none"
        onClick={onClick}
      >
        <MdClose className="text-2xl" />
      </DialogClose>
    </DialogContent>
  );
}

export default ConnectionListModal;
