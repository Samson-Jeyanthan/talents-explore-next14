"use client";

import { cn } from "@/lib/utils";
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "../ui/dialog";
import LoadFollowerList from "../others/LoadFollowerList";
import { MdClose } from "react-icons/md";

function ConnectionListModal({
  currentTab,
  onClick,
}: {
  currentTab: number;
  onClick: () => void;
}) {
  return (
    <>
      <DialogOverlay className={cn("bg-black/10 backdrop-blur-sm")} />
      <DialogContent
        className="flex max-h-[70vh] min-h-[70vh] max-w-[30rem] flex-col items-center gap-3 rounded-xl border-none bg-dark-250 p-5"
        aria-describedby={undefined}
      >
        <DialogTitle className="sticky top-0 z-10 h-max bg-dark-250 py-2 text-light-900">
          {currentTab === 1 ? "Followers" : "Following"}
        </DialogTitle>
        <div className="z-0 flex w-full flex-col gap-4 overflow-y-scroll">
          <LoadFollowerList />
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
