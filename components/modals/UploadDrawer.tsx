"use client";

import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { SelectionCard } from "../cards";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const UploadDrawer = ({ open, setOpen }: Props) => {
  const router = useRouter();

  const handleUploadPageClick = (option: "create-post" | "share") => {
    if (option === "create-post") {
      router.push("/create-post");
    } else if (option === "share") {
      router.push("/share");
    }
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="flex-start h-[45%] gap-2 border-none bg-dark-200">
        <DrawerHeader className="flex w-full flex-col items-center gap-2">
          <DrawerTitle className="text-center text-2xl font-semibold text-light-900">
            Choose a method to start.
          </DrawerTitle>
          <DrawerDescription className="w-1/4 text-center text-light-700">
            Showcase your talents by creating a post or share anything
            interesting from the web or social media.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex w-96 flex-col gap-6">
          <SelectionCard
            title="Create Post"
            description="Display your performance"
            imgSrc="/assets/images/create-post.png"
            onClick={() => handleUploadPageClick("create-post")}
          />
          <SelectionCard
            title="Share Anything"
            description="Share what inspires you"
            imgSrc="/assets/images/share-anything.png"
            onClick={() => handleUploadPageClick("share")}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default UploadDrawer;
