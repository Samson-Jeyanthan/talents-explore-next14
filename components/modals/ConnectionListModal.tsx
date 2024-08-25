"use client";

import { cn } from "@/lib/utils";
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "../ui/dialog";
import { MdClose } from "react-icons/md";
import { LoadFollowerList, LoadFollowingList } from "../others";

function ConnectionListModal({
  isTalent,
  currentTab,
  onClick,
  setCuurentTab,
}: {
  isTalent: boolean;
  currentTab: number;
  onClick: () => void;
  setCuurentTab: (currentTab: number) => void;
}) {
  return (
    <>
      <DialogOverlay className={cn("bg-black/10 backdrop-blur-sm")} />
      <DialogContent
        className="connection-modal-content"
        aria-describedby={undefined}
      >
        <DialogTitle className="sticky top-0 z-10 flex h-max w-full items-center justify-between rounded-xl bg-dark-250">
          {isTalent && (
            <>
              <h2
                className={`${currentTab === 0 ? "active-connection-tab" : "text-light-600"} default-connection-tab`}
                onClick={() => setCuurentTab(0)}
              >
                Ratings
              </h2>
              <h2
                className={`${currentTab === 1 ? "active-connection-tab" : "text-light-600"} default-connection-tab`}
                onClick={() => setCuurentTab(1)}
              >
                Followers
              </h2>
            </>
          )}
          <h2
            className={`${currentTab === 2 ? "active-connection-tab" : "text-light-600"} default-connection-tab`}
            onClick={() => setCuurentTab(2)}
          >
            Following
          </h2>
        </DialogTitle>

        <div className="z-0 flex w-full flex-col gap-4 overflow-y-scroll p-4">
          {isTalent ? (
            <>
              {currentTab === 0 ? (
                <LoadFollowerList />
              ) : currentTab === 1 ? (
                <LoadFollowerList />
              ) : (
                <LoadFollowingList />
              )}
            </>
          ) : (
            <LoadFollowingList />
          )}
        </div>
        <DialogClose
          className="absolute -right-8 -top-8 cursor-pointer rounded-full bg-dark-250 p-[6px] text-light-900 focus:outline-none"
          onClick={onClick}
        >
          <MdClose className="text-2xl" />
        </DialogClose>
      </DialogContent>
    </>
  );
}

export default ConnectionListModal;
