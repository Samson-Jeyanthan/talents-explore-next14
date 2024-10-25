import { getNameOfCategory } from "@/lib/utils/ReactElementUtils";

const TagPage = async ({ params }: { params: { id: string } }) => {
  const categoryData = await getNameOfCategory(params.id);
  return (
    <section>
      <div className="flex-center gap-4 fill-light-800 text-4xl font-semibold text-light-800">
        {categoryData?.icon && <categoryData.icon width="48px" height="48px" />}
        {categoryData?.name}
      </div>
    </section>
  );
};

export default TagPage;
