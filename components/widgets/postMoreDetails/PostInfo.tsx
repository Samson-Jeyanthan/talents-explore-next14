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
    console.log(showSeeMore, isSeeMore, "see-more");
    if (postDescRef.current) {
      const postDescElement = postDescRef.current;
      postDescRef.current.style.height = `${postDescRef.current.scrollHeight}px`;
      setShowSeeMore(postDescElement.scrollHeight >= 300);
    }
  }, [isSeeMore, postData.about.description, showSeeMore]);

  return (
    <div className="flex w-full flex-col gap-2 text-sm text-light-500">
      <h2 className="font-medium text-light-900">Description</h2>
      <div
        ref={postDescRef}
        className={`${isSeeMore ? "[h-300px]" : "h-max"} w-full overflow-hidden border border-solid border-custom-200 transition-all duration-300 ease-in-out`}
      >
        <div className="text-justify">
          {addLineBreaks(postData.about.description)}
        </div>
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
          {isSeeMore ? "show less" : "see more..."}
        </p>
      ) : null}
    </div>
  );
};

export default PostInfo;
