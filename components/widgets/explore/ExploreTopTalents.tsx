import { ExploreTopTalentsCard } from "@/components/cards";
import { ITopTalentsProps } from "@/types/utils.types";

type Props = {
  data: ITopTalentsProps[];
};

const ExploreTopTalents = ({ data }: Props) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-semibold text-light-800">Top Talents</h3>

      <div className="flex flex-wrap gap-3">
        {data.map((item, index) => (
          <ExploreTopTalentsCard
            key={index}
            src={item.profileImage}
            userName={item.userName}
            profession={item.professional}
            avgRating={item.avgRating}
            userId={item._id}
          />
        ))}
      </div>
    </div>
  );
};

export default ExploreTopTalents;
