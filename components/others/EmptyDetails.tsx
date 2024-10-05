import { TConvertedSvgJsxProps } from "@/types/utils.types";
import React from "react";
import { IconType } from "react-icons/lib";

type Props = {
  Icon: IconType | React.ComponentType<TConvertedSvgJsxProps>;
  text: string;
  size?: string;
};

const EmptyDetails = ({ Icon, text, size }: Props) => {
  return (
    <div className="flex flex-col items-center gap-4 fill-light-500/40 p-5 text-[13px] text-light-500/60">
      <Icon width={size} height={size} />
      <p className="text-center">{text}</p>
    </div>
  );
};

export default EmptyDetails;
