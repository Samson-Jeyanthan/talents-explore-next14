import { cn } from "@/lib/utils";
import Image from "next/image";

type Props = {
  title: string;
  description: string;
  imgSrc: string;
  imgClassName?: string;
  onClick?: () => void;
};

const SelectionCard = ({
  title,
  description,
  imgSrc,
  imgClassName,
  onClick,
}: Props) => {
  return (
    <div className="account_selection_button" onClick={onClick}>
      <Image
        src={imgSrc}
        width={512}
        height={512}
        alt="img"
        className={cn(
          `size-[4.2rem] rounded-xl border-2 border-dark-250 bg-dark-300 p-2 ${imgClassName}`
        )}
      />
      <div className="flex flex-col gap-1">
        {title}
        <p className="text-sm">{description}</p>
      </div>
    </div>
  );
};

export default SelectionCard;
