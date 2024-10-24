import Link from "next/link";
import React from "react";
import { Badge } from "../ui/badge";
import { IconType } from "react-icons/lib";
import { TConvertedSvgJsxProps } from "@/types/utils.types";

interface Props {
  _id?: string;
  name: string;
  showIcon?: boolean;
  iconSize?: string;
  isReactIcon?: boolean;
  Icon: IconType | React.ComponentType<TConvertedSvgJsxProps> | any;
  isNotLink?: boolean;
}

const RenderTag = ({
  _id,
  name,
  showIcon,
  Icon,
  isReactIcon,
  iconSize,
  isNotLink,
}: Props) => {
  return (
    <>
      {isNotLink ? (
        <Badge className="flex w-max items-center gap-2 rounded-lg border-none bg-dark-300 fill-light-500 px-4 py-2 text-xs uppercase text-light-500 hover:bg-dark-400 hover:fill-light-900 hover:text-light-900">
          {showIcon && (
            <>
              {isReactIcon ? (
                <Icon className="text-lg text-light-500" />
              ) : (
                <Icon width={iconSize} height={iconSize} />
              )}
            </>
          )}

          {name}
        </Badge>
      ) : (
        <Link
          href={`/tags/${_id}`}
          className="flex w-max items-center justify-between gap-4 rounded-lg border-none bg-dark-300 fill-light-500 px-4 py-3 text-xs uppercase text-light-500 hover:bg-dark-400 hover:fill-light-900 hover:text-light-900"
        >
          {showIcon && (
            <>
              {isReactIcon ? (
                <Icon className="text-lg text-light-500" />
              ) : (
                <Icon width={iconSize} height={iconSize} />
              )}
            </>
          )}
          {name}
        </Link>
      )}
    </>
  );
};

export default RenderTag;
