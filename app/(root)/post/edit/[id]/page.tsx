import { getPostByIdAction } from "@/actions/post.action";
import EmblaCarousel from "@/components/widgets/mediaCarousal/EmblaCarousal";
import { getSession } from "@/lib/session";
import { TPostProps } from "@/types/post.types";
import { EmblaOptionsType } from "embla-carousel";
import React from "react";
import NotFound from "../../[id]/not-found";

const OPTIONS: EmblaOptionsType = { loop: true };
// const SLIDE_COUNT = 5;
// const SLIDES = Array.from(Array(SLIDE_COUNT).keys());

const PostEdit = async ({ params }: { params: { id: string } }) => {
  const session = await getSession();
  const userId = session || "no_user";
  const data: TPostProps = await getPostByIdAction(params.id, userId);

  if (data?.status === 400) {
    return <NotFound />;
  }

  return (
    <div>
      <EmblaCarousel slides={data?.media} options={OPTIONS} />
    </div>
  );
};

export default PostEdit;
