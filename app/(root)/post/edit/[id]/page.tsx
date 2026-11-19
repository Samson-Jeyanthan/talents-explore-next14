import PostEditorPage from "@/components/forms/PostEditorPage";

export const dynamic = "force-dynamic";
const PostEdit = ({ params }: { params: { id: string } }) => {
  return <PostEditorPage id={params.id} expectedType="POST" />;
};

export default PostEdit;
