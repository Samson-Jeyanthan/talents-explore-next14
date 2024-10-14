import { RenderTag } from "@/components/others";

type Props = {
  data: any[];
};

const ExploreCategories = ({ data }: Props) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-semibold text-light-800">Categories</h3>
      <div className="flex flex-wrap items-start gap-2">
        {data.map((item, index) => (
          <RenderTag key={index} Icon="" name={item.name} _id={item._id} />
        ))}
      </div>
    </div>
  );
};

export default ExploreCategories;
