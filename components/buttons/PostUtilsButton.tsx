"use client";

import { cn } from "@/lib/utils";
import { SaveIcon, ShareIcon } from "@/public/assets/svgs";

type Props = {
  buttonFor: "SHARE" | "COMMENT" | "SAVE";
  className?: string;
};

const PostUtilsButton = ({ buttonFor, className }: Props) => {
  return (
    <div
      className={cn(
        `rounded-full bg-dark-300 fill-light-900 text-xs text-light-900 flex gap-2 items-center justify-center cursor-pointer font-normal ${className}`
      )}
    >
      {buttonFor === "SAVE" ? (
        <div className="flex items-center gap-2">
          <SaveIcon width="17px" height="18px" />
          <p>Save</p>
        </div>
      ) : null}
      {buttonFor === "COMMENT" ? <p>Comment</p> : null}
      {buttonFor === "SHARE" ? <ShareIcon width="18px" height="18px" /> : null}
    </div>
  );
};

export default PostUtilsButton;
