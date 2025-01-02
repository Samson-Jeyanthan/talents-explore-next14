"use client";

import { cn } from "@/lib/utils";
import { CommentIcon, SaveIcon, ShareIcon } from "@/public/assets/svgs";

type Props = {
  buttonFor: "SHARE" | "COMMENT" | "SAVE";
  className?: string;
  size?: string;
  isSaveText?: boolean;
};

const PostUtilsButton = ({ buttonFor, className, size, isSaveText }: Props) => {
  return (
    <div
      className={cn(
        `rounded-full bg-dark-300 fill-light-900 text-xs text-light-900 flex gap-2 items-center justify-center cursor-pointer font-normal ${className}`
      )}
    >
      {buttonFor === "SAVE" ? (
        <div className="flex items-center gap-2">
          <SaveIcon width={size || "17px"} height={size || "18px"} />
          {isSaveText && <p>Save</p>}
        </div>
      ) : null}
      {buttonFor === "COMMENT" ? (
        <CommentIcon width={size || "18px"} height={size || "18px"} />
      ) : null}
      {buttonFor === "SHARE" ? (
        <ShareIcon width={size || "18px"} height={size || "18px"} />
      ) : null}
    </div>
  );
};

export default PostUtilsButton;
