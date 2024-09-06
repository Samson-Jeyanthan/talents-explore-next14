import { addLineBreaks } from "@/lib/utils/addLinkBreaks";
import { TPostProps } from "@/types/post.types";

type Props = {
  postData: TPostProps;
};

const PostInfo = ({ postData }: Props) => {
  return (
    <div className="flex flex-col gap-2 text-sm text-light-500">
      <h2 className="font-medium text-light-900">Description</h2>
      <p className="text-justify">
        {addLineBreaks(postData.about.description)}
      </p>
      {postData.about.keywords.map((keyword) => (
        <p key={keyword} className="mt-1 text-xs">
          {keyword}
        </p>
      ))}
    </div>
  );
};

export default PostInfo;
