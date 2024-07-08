"use client";

import { cn } from "@/lib/utils";
import { DialogContent, DialogOverlay } from "../ui/dialog";
import { Button } from "../ui/button";

const ProfileOption = () => {
  return (
    <>
      <DialogOverlay className={cn("bg-black/10 backdrop-blur-sm")} />
      <DialogContent className="flex max-w-96 flex-col items-center gap-3 rounded-2xl border-none bg-dark-250 p-5">
        <header>choose Your Account Type</header>
        <Button className="shad-button_primary">Wanna Become a Talent</Button>
        <Button className="shad-button_primary">Continue as Normal User</Button>
      </DialogContent>
    </>
  );
};

export default ProfileOption;
