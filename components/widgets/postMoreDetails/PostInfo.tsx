"use client";

import { addLineBreaks } from "@/lib/utils/addLinkBreaks";
import { TPostProps } from "@/types/post.types";
import { useEffect, useRef, useState } from "react";

type Props = {
  postData: TPostProps;
};

const PostInfo = ({ postData }: Props) => {
  const postDescRef = useRef<HTMLDivElement | null>(null);
  const [isSeeMore, setIsSeeMore] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);

  useEffect(() => {
    if (postDescRef.current) {
      const postDescElement = postDescRef.current;
      postDescRef.current.style.height = `${postDescRef.current.scrollHeight}px`;
      setShowSeeMore(postDescElement.scrollHeight >= 210);
    }
  }, [postData.about.description]);

  return (
    <div className="flex flex-col gap-2 text-sm text-light-500">
      <h2 className="font-medium text-light-900">Description</h2>
      <div
        ref={postDescRef}
        className={`${isSeeMore ? "h-auto" : "h-52"} overflow-hidden transition-all duration-300 ease-in-out`}
      >
        <p className="text-justify">
          {addLineBreaks(postData.about.description)}
        </p>
        {postData.about.keywords.map((keyword) => (
          <p key={keyword} className="mt-1 text-xs">
            {keyword}
          </p>
        ))}
      </div>
      {showSeeMore ? (
        <p
          className="-mt-2 w-max cursor-pointer text-[13px] font-medium text-light-700"
          onClick={() => setIsSeeMore(!isSeeMore)}
        >
          {isSeeMore ? "show ess" : "see more..."}
        </p>
      ) : null}
    </div>
  );
};

export default PostInfo;
