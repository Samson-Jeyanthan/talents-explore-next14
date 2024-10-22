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
        <div className="flex items-center justify-between gap-2 fill-light-500">
          {showIcon && (
            <>
              {isReactIcon ? (
                <Icon className="text-lg text-light-500" />
              ) : (
                <Icon width={iconSize} height={iconSize} />
              )}
            </>
          )}
          <Badge className="w-max rounded-lg border-none bg-dark-300 px-4 py-2 text-xs uppercase text-light-500">
            {name}
          </Badge>
        </div>
      ) : (
        <Link
          href={`/tags/${_id}`}
          className="flex items-center justify-between gap-2 fill-light-500"
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
          <Badge className="w-max rounded-lg border-none bg-dark-300 px-4 py-2 text-xs uppercase text-light-500">
            {name}
          </Badge>
        </Link>
      )}
    </>
  );
};

export default RenderTag;
