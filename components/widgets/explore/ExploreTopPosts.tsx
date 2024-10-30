"use client";

import { ExplorePostCard } from "@/components/cards";

const ExploreTopPosts = ({ data }) => {
  return (
    <div className="flex flex-wrap gap-6">
      {data?.map((item, index) => (
        <ExplorePostCard key={index} postCard={item} index={index} />
      ))}
    </div>
  );
};

export default ExploreTopPosts;
