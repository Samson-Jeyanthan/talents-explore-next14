import CustomLoader from "../ui/custom-loader";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "../ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  text?: string;
};

const TransparentLoader = ({ text }: Props) => {
  return (
    <Dialog open={true}>
      <DialogOverlay className={cn("bg-black/10 backdrop-blur-sm")} />
      <DialogContent
        className="flex max-w-96 flex-col items-center gap-3 rounded-xl border-none bg-none p-5"
        aria-describedby={undefined}
      >
        <DialogTitle className="hidden" />
        <CustomLoader />
        <p className="text-light-900">{text}</p>
      </DialogContent>
    </Dialog>
  );
};

export default TransparentLoader;
