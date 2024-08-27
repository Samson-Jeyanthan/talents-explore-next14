import { IAllPostCardProp } from "@/types/post.types";
import React from "react";
import { MotionDiv } from "../others/MotionDiv";
import Image from "next/image";
import Link from "next/link";

interface Prop {
  allPostCard: IAllPostCardProp;
  index: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

function AllPostCard({ allPostCard, index }: Prop) {
  return (
    <MotionDiv
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{
        delay: index * 0.15,
        ease: "easeInOut",
        duration: 0.3,
      }}
      viewport={{ amount: 0 }}
      className="flex gap-3 rounded-xl bg-dark-300 p-4"
    >
      <Image
        src={allPostCard.media[0].url}
        alt={allPostCard.about.title}
        width={1024}
        height={512}
        className="h-52 w-80 min-w-80 rounded-lg bg-dark-400 object-cover"
      />
      <div className="flex flex-col gap-3">
        <Link
          href={`post/${allPostCard._id}`}
          className="cursor-pointer text-base text-light-900"
        >
          {allPostCard.about.title}
        </Link>
        <p>{allPostCard.about.description}</p>
      </div>
    </MotionDiv>
  );
}

export default AllPostCard;
