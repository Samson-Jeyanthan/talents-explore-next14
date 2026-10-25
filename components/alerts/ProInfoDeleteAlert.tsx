"use client";

import { editUserLanguageInfoAction } from "@/actions/user.action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

type Props = {
  isOpen: boolean;
  modalFor: "language" | "education" | "award";
  onCancel: () => void;
  data?: any;
  dataArray?: any[];
  selectedIndex?: number;
};

const ProInfoDeleteAlert = ({
  isOpen,
  modalFor,
  onCancel,
  data,
  dataArray,
  selectedIndex,
}: Props) => {
  const pathName = usePathname();

  const handleInfoDelete = async () => {
    const updatedArray = dataArray?.filter(
      (item: any) => item._id !== data._id
    );

    let res: any = {};

    console.log("updatedArray", updatedArray);

    if (modalFor === "language") {
      res = await editUserLanguageInfoAction({
        formData: updatedArray,
        path: pathName,
      });
    }

    if (res?.status === "7400") {
      const formattedModalFor =
        modalFor.charAt(0).toUpperCase() + modalFor.slice(1);

      toast.success(`${formattedModalFor} Deleted Successfully`, {
        duration: 5000,
      });
    } else {
      toast.error("Something went wrong, please try again", {
        duration: 5000,
      });
    }

    onCancel();
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogOverlay />
      <AlertDialogContent className="flex flex-col gap-6 rounded-2xl border-none bg-dark-300 p-4 text-light-850">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete ${modalFor.charAt(0).toUpperCase()} Detail
          </AlertDialogTitle>
          <AlertDialogDescription>
            You will permanently delete this info. Are you sure you want to
            delete this {modalFor} detail?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            className="rounded-full border-none bg-none text-light-900 hover:bg-dark-400"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="shad-btn_primary-200"
            onClick={handleInfoDelete}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ProInfoDeleteAlert;
