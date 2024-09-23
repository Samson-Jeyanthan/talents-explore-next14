"use client";

import { HiCheckCircle } from "react-icons/hi2";
import { MotionDiv } from "../others/MotionDiv";
import { useState } from "react";
import {
  handleAddPostToCollection,
  handleRemovePostFromCollection,
} from "@/lib/functions/post.functions";

interface Props {
  collectionId: string;
  collectionName: string;
  postId: string;
  postStatus: boolean;
  index: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const SavedListCard = ({
  collectionId,
  collectionName,
  postId,
  postStatus,
  index,
}: Props) => {
  const [isSaved, setIsSaved] = useState(postStatus);

  const handleSubmit = async () => {
    setIsSaved(!isSaved);
    const toggleSave = isSaved
      ? handleRemovePostFromCollection
      : handleAddPostToCollection;
    const res = await toggleSave(collectionId, collectionName, postId);

    setIsSaved(res ? !isSaved : isSaved);
  };

  return (
    <MotionDiv
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{
        delay: index * 0.05,
        ease: "easeInOut",
        duration: 0.1,
      }}
      viewport={{ amount: 0 }}
      className="flex-between w-full cursor-pointer rounded-md p-4 capitalize text-light-850 hover:bg-dark-300"
      onClick={handleSubmit}
    >
      <p>{collectionName}</p>
      <span className="size-[1.3rem] rounded-full border border-solid border-dark-400 text-[1.4rem] text-light-850">
        {isSaved ? <HiCheckCircle /> : null}
      </span>
    </MotionDiv>
  );
};

export default SavedListCard;
