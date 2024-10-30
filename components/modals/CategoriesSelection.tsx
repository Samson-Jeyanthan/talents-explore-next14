import { Dialog, DialogClose, DialogContent, DialogTitle } from "../ui/dialog";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const CategoriesSelection = ({ onClose, isOpen }: Props) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="">
        <DialogTitle>Categories Selection</DialogTitle>
        <DialogClose className="no-focus w-44 cursor-pointer rounded-md bg-dark-400 p-1 text-light-900">
          Cancel
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default CategoriesSelection;
