import PostEditorPage from "@/components/forms/PostEditorPage";

export const dynamic = "force-dynamic";
const EditShare = ({ params }: { params: { id: string } }) => {
  return <PostEditorPage id={params.id} expectedType="SHARELINK" />;
};

export default EditShare;
