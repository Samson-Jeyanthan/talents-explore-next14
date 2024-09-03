import { userTopPostInfoAction } from "@/actions/user.action";
import { TProfileURLProps } from "@/types/utils.types";

const TopPosts = async ({ params }: TProfileURLProps) => {
  const data = await userTopPostInfoAction(params.userId);
  if (data?.status === 400) return null;

  return <div>{data}</div>;
};

export default TopPosts;
