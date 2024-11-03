"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "../ui/dialog";
import { useEffect, useState } from "react";
import { PostUtilsButton } from "../buttons";
import { MdClose } from "react-icons/md";
import { useUserContext } from "@/context/AuthProvider";
import { ISavedFolder } from "@/types/post.types";
import { handleCreateSaveCollection } from "@/lib/functions/post.functions";
import { SavedListCard } from "../cards";
import { Input } from "../ui/input";
import { SendIcon } from "@/public/assets/svgs";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { getAllSavedFoldersAction } from "@/actions/save.action";

const SaveCollection = ({ postId }: { postId: string }) => {
  const { user } = useUserContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ISavedFolder[]>([]);
  const reversedList = data?.slice().reverse();
  const [newFolder, setNewFolder] = useState("");

  async function fetchData() {
    try {
      const res = await getAllSavedFoldersAction({
        userId: user.currentUserId,
        postId,
        returnAsCard: false,
      });
      if (res.status === 200) {
        setData(res.response);
      } else {
        toast.error("Couldn't fetch saved collections", { duration: 4000 });
        return false;
      }
    } catch (error) {
      console.error("Error fetching saved collections:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleOnClose = () => {
    setData([]);
    setIsOpen(false);
  };

  const handleSubmit = () => {
    handleCreateSaveCollection(
      user.currentUserId,
      newFolder,
      `/saved-collection`
    );
    setNewFolder("");
    fetchData();
  };

  return (
    <Dialog open={isOpen}>
      <DialogTrigger onClick={() => setIsOpen(true)}>
        <PostUtilsButton buttonFor="SAVE" className="p-3" />
      </DialogTrigger>
      <DialogContent
        className="connection-modal-content !rounded-2xl"
        aria-describedby={undefined}
      >
        <DialogTitle className="sticky top-0 w-full rounded-t-2xl border-b border-solid border-light-500 bg-dark-250 p-2 pt-3 text-center text-xl font-medium text-light-850">
          Save To Collection
        </DialogTitle>
        <div className="flex w-full flex-col gap-3 overflow-y-scroll p-3 pb-16">
          {isLoading ? (
            "loading"
          ) : (
            <>
              {reversedList?.map((item, index) => (
                <SavedListCard
                  key={index}
                  index={index}
                  collectionId={item._id}
                  collectionName={item.collectionName}
                  postId={postId}
                  postStatus={item.status}
                />
              ))}
            </>
          )}
        </div>

        <div className="flex-center fixed bottom-0 w-full gap-3 rounded-b-2xl border-t border-solid border-dark-300 bg-dark-250 p-3">
          <Input
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            placeholder="New Collection"
            className="no-focus max-h-[180px] min-h-[40px] w-full rounded-xl border-2 border-solid border-dark-300 bg-dark-200 leading-5 text-light-900 outline-none placeholder:text-light-500"
          />

          {newFolder && (
            <Button
              className="flex gap-2 rounded-full border-none bg-primary-500 fill-light-900 p-3 text-[13px] text-light-900"
              onClick={handleSubmit}
            >
              <SendIcon width="16px" height="16px" />
            </Button>
          )}
        </div>

        <DialogClose
          className="absolute -right-12 -top-8 cursor-pointer rounded-full bg-dark-250 p-[7px] text-light-900 focus:outline-none"
          onClick={handleOnClose}
        >
          <MdClose className="text-2xl" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default SaveCollection;
