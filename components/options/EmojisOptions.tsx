"use client";

import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { SmilyIcon } from "@/public/assets/svgs";

type Props = {
  onClick: (emoji: string) => void;
};

const emojiList = ["😂", "❤️", "👍", "🔥", "😢", "😡"];

const EmojisOptions = ({ onClick }: Props) => {
  const handleClick = (emoji: string) => {
    onClick(emoji);
  };
  return (
    <Popover>
      <PopoverTrigger className="flex-center cursor-pointer rounded-full fill-light-500 p-2 hover:bg-dark-300 hover:fill-light-900">
        <SmilyIcon width={"18px"} height={"18px"} />
      </PopoverTrigger>
      <PopoverContent className="flex w-max gap-1 rounded-full border-none bg-dark-300 p-1 text-xl">
        {emojiList.map((item, index) => (
          <PopoverClose
            key={index}
            className="cursor-pointer rounded-full p-1 hover:bg-dark-400"
            onClick={() => handleClick(item)}
          >
            {item}
          </PopoverClose>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default EmojisOptions;
