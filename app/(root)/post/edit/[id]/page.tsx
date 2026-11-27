import PostEditorPage from "@/components/forms/PostEditorPage";
import { getCurrentAccountAccessAction } from "@/actions/account-access.action";
import TalentAccessNotice from "@/components/others/TalentAccessNotice";

export const dynamic = "force-dynamic";
const PostEdit = async ({ params }: { params: { id: string } }) => {
  const user = await getCurrentAccountAccessAction();
  if (!user.isTalent) return <TalentAccessNotice />;
  return <PostEditorPage id={params.id} expectedType="POST" />;
};

export default PostEdit;
