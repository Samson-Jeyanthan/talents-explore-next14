"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "../ui/dialog";
import { getMainCategoriesAction } from "@/actions/utils.action";
import { getCategoryDetails } from "@/lib/utils/ReactElementUtils";
import { CategoryCard } from "../cards";
import { MdClose } from "react-icons/md";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

interface ICategory {
  name: string;
  _id: string;
}

const CategoriesSelection = ({ onClose, isOpen }: Props) => {
  const [categories, setCategories] = useState<ICategory[]>([]);

  async function fetchData() {
    const res: any = await getMainCategoriesAction();
    if (res.status === "7400") {
      setCategories(res.response);
    }
  }
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex !h-[80vh] !max-h-[80vh] !w-[70vw] !max-w-[70vw] flex-col items-center justify-start gap-8 rounded-[2rem] border border-dark-300 bg-dark-100/90">
        <DialogTitle className="sticky top-0 py-3 text-center text-3xl font-semibold text-light-800">
          Categories Selection
        </DialogTitle>
        <div className="flex w-full flex-wrap items-center justify-center gap-4 overflow-y-auto">
          {categories.map((item, index) => {
            const detail = getCategoryDetails(item?.name);
            return (
              <CategoryCard
                _id={item?._id}
                key={index}
                categoryCard={detail}
                index={index}
                onClose={onClose}
              />
            );
          })}
        </div>
        <DialogClose
          className="absolute right-4 top-4 cursor-pointer rounded-full bg-dark-250 p-[6px] text-light-700 hover:text-light-900 focus:outline-none"
          onClick={onClose}
        >
          <MdClose className="text-2xl" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default CategoriesSelection;
