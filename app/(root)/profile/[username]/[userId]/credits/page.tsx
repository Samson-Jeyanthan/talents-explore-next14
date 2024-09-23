import { getSession } from "@/lib/session";
import { ProfileURLProps } from "../layout";
import { getUserCreditPostsAction } from "@/actions/post.action";
import AlertNote from "@/components/others/AlertNote";

async function Credits({ params }: ProfileURLProps) {
  const token = await getSession();
  const data = await getUserCreditPostsAction(params.userId, token, 1, 5);

  if (data?.status === 400) {
    return <AlertNote />;
  }

  return <section className="my-8 flex flex-col gap-4">{data}</section>;
}

export default Credits;
