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
import { useUserContext } from "@/context/AuthProvider";
import { toast } from "sonner";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const UploadDrawer = ({ open, setOpen }: Props) => {
  const router = useRouter();
  const { user } = useUserContext();

  const handleUploadPageClick = (option: "create-post" | "share") => {
    if (option === "create-post") {
      if (user.isTalent !== true) {
        toast.info(
          "Become a talent to create posts. You can still share links.",
        );
        return;
      }
      router.push("/create-post");
    } else if (option === "share") {
      router.push("/share");
    }
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="flex-start h-1/2 gap-2 border-none bg-dark-200">
        <DrawerHeader className="flex w-full flex-col items-center gap-2">
          <DrawerTitle className="text-center text-2xl font-semibold text-light-900">
            Choose a method to start.
          </DrawerTitle>
          <DrawerDescription className="w-1/4 text-center text-light-700">
            Showcase your talents by creating a post or share anything
            interesting from the web or social media.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex w-full max-w-96 flex-col gap-6 px-4">
          <SelectionCard
            title="Create Post"
            description={
              user.isTalent === true
                ? "Display your performance"
                : "Become a talent to create posts"
            }
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
