import { TConvertedSvgJsxProps } from "@/types/utils.types";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { IconType } from "react-icons/lib";

interface Props {
  _id: string;
  categoryCard: {
    name: string;
    icon: IconType | React.ComponentType<TConvertedSvgJsxProps>;
    description: string;
    bgImg?: string;
  };
  index: number;
  onClose?: () => void;
}

const CategoryCard = ({ _id, categoryCard, index, onClose }: Props) => {
  return (
    <Link
      href={`/category/${_id}`}
      className="relative h-44 w-64 rounded-2xl"
      onClick={onClose}
    >
      <Image
        src={
          categoryCard.bgImg || "/assets/images/sample-profile-cover-photo.jpg"
        }
        alt="img"
        width={1024}
        height={1024}
        className="size-full rounded-2xl object-cover"
      />
      <div className="flex-center absolute left-0 top-0 z-10 size-full rounded-2xl bg-gradient-to-b from-[rgb(17,19,27,0.0)] to-[rgba(17,19,27)]">
        <h2 className="w-[90%] text-center text-[22px] font-medium text-light-800">
          {categoryCard.name}
        </h2>
      </div>
    </Link>
  );
};

export default CategoryCard;
