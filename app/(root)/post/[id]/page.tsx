import { getPostByIdAction } from "@/actions/post.action";
import { TPostProps, TPostURLProps } from "@/types/post.types";
import { Metadata, ResolvingMetadata } from "next";
import NotFound from "./not-found";
import {
  Comments,
  MediaCarosel,
  PostInfo,
  PostInfoHeader,
  RatingDetails,
  TagsAndOtherInfo,
} from "@/components/widgets";
import Image from "next/image";
import { getSession } from "@/lib/session";

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

  return (
    <section className="flex w-full justify-center">
      <section className="relative flex w-full flex-col items-center gap-3 2xl:max-w-[1300px]">
        {data._id}
        <MediaCarosel postData={data} />
        <Image
          src={data.media[0]?.url ? data?.media[0]?.url : ""}
          width={200}
          height={200}
          className="fixed top-0 size-[40rem] opacity-30"
          alt="blur-media-img"
        />
        <div className="flex w-4/5 flex-col gap-6 rounded-[28px] border-2 border-solid border-dark-300 bg-dark-200/50 p-5 backdrop-blur-3xl">
          <PostInfoHeader postData={data} />
          <div className="flex items-start justify-between gap-8">
            <div className="flex flex-col gap-4">
              <PostInfo postData={data} />
              <RatingDetails postData={data} />
              <Comments
                numberOfComments={data.numberOfComments}
                params={params}
              />
            </div>
            <TagsAndOtherInfo postData={data} />
          </div>
        </div>
      </section>
    </section>
  );
}

export default Post;
