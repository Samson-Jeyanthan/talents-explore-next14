import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { BsFillQuestionCircleFill } from "react-icons/bs";

type Props = {
  title: string;
  description: string;
  className?: string;
};

const UploadForm = ({ title, description, className }: Props) => {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger
          className={cn(
            `-mb-1 flex w-36 items-center gap-2 text-left text-sm text-light-800`,
            className
          )}
        >
          <BsFillQuestionCircleFill className="text-[14px] text-light-500" />
          {title}
        </TooltipTrigger>
        <TooltipContent
          className="absolute left-[-19rem] top-5 w-full min-w-52 border border-dark-400 bg-dark-250 text-xs text-light-500 shadow-lg"
          sideOffset={10}
        >
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default UploadForm;
