import { getPostByIdAction } from "@/actions/post.action";
import { TPostProps, TPostURLProps } from "@/types/post.types";
import { Metadata, ResolvingMetadata } from "next";
import NotFound from "./not-found";
import {
  BlurredMedia,
  Comments,
  PostInfo,
  PostInfoHeader,
  RatingDetails,
  TagsAndOtherInfo,
} from "@/components/widgets";
import { getSession } from "@/lib/session";
import EmblaCarousel from "@/components/widgets/mediaCarousal/EmblaCarousal";
import { EmblaOptionsType } from "embla-carousel";

export const revalidate = 1800;

export async function generateMetadata(
  { params }: TPostURLProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const postData: TPostProps = await getPostByIdAction(params.id, "userId");

  // optionally access and extend (rather than replace) parent metadata
  // const previousImages = (await parent).openGraph?.images || [];

  if (postData?.status === 400) {
    return {
      title: "Post Not Found",
    };
  } else
    return {
      title: postData?.about?.title + " | " + "Post",

      // openGraph: {
      //   images: ["/some-specific-page-image.jpg", ...previousImages],
      // },
    };
}

async function Post({ params }: TPostURLProps) {
  const session = await getSession();
  const userId = session || "no_user";
  const data: TPostProps = await getPostByIdAction(params.id, userId);

  if (data?.status === 400) {
    return <NotFound />;
  }

  let loop = false;
  data?.media?.length / 2 > 1 ? (loop = true) : (loop = false);
  const OPTIONS: EmblaOptionsType = { loop };

  return (
    <section className="mt-4 flex w-full justify-center">
      <section className="relative flex w-full flex-col items-center gap-3 p-3 2xl:max-w-[1300px]">
        <EmblaCarousel slides={data?.media} options={OPTIONS} />
        <div className="relative mt-4 h-auto w-[90%] items-center justify-center lg:w-[85%]">
          <BlurredMedia postData={data} />
          <div className="z-10 flex w-full flex-col gap-6 rounded-[28px] border-2 border-solid border-dark-300 bg-dark-200/50 p-5 backdrop-blur-[80px]">
            <PostInfoHeader postData={data} />

            <div className="flex items-start justify-between gap-8">
              <div className="flex flex-col gap-6">
                <PostInfo postData={data} />
                <RatingDetails postData={data} />
                <Comments
                  numberOfComments={data?.numberOfComments}
                  params={params}
                />
              </div>
              <TagsAndOtherInfo postData={data} />
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

export default Post;
