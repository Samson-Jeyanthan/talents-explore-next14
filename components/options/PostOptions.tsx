"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { POST_OPTIONS } from "@/constants";
import { useUserContext } from "@/context/AuthProvider";
import {
  handlePinnedToProfile,
  handleRemoveFromProfile,
} from "@/lib/functions/post.functions";
import { cn, getLinkCopied } from "@/lib/utils";
import React, { useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { deletePostAction } from "@/actions/post.action";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

type Prop = {
  authorId: string;
  postId: string;
  isBestWork: boolean;
  className?: string;
  postType?: "POST" | "SHARELINK";
};

const PostOptions = ({
  authorId,
  postId,
  isBestWork,
  className,
  postType,
}: Prop) => {
  const { user } = useUserContext();
  const isOwnPost = authorId === user?.currentUserId;
  const [isPinned, setIsPinned] = useState(isBestWork);
  const router = useRouter();
  const pathname = usePathname();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    if (deleting || !isOwnPost) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const result = await deletePostAction(postId);
      if (!result.success) {
        setDeleteError(result.message);
        return;
      }
      setConfirmDelete(false);
      toast.success(result.message);
      if (pathname === `/post/${postId}` || pathname === `/share/${postId}`) {
        router.replace(postType === "SHARELINK" ? "/share-feed" : "/home");
      }
      router.refresh();
    } catch {
      setDeleteError("Unable to delete this post. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handlePostOptionClick = (id: number) => {
    if (id === 0) {
      if (isPinned) {
        handleRemoveFromProfile(
          user?.currentUserId,
          postId,
          `/profile/${user?.username}/${user?.currentUserId}/all-posts`,
        );
        setIsPinned(false);
      } else {
        handlePinnedToProfile(
          user?.currentUserId,
          postId,
          `/profile/${user?.username}/${user?.currentUserId}/all-posts`,
        );
        setIsPinned(true);
      }
    } else if (id === 2 && isOwnPost) {
      router.push(
        `/${postType === "SHARELINK" ? "share" : "post"}/edit/${postId}`,
      );
    } else if (id === 3 && isOwnPost) {
      setDeleteError("");
      setConfirmDelete(true);
    } else if (id === 1 || id === 4) {
      const linkToCopy = process.env.NEXT_PUBLIC_DOMAIN_URL + "/post/" + postId;
      getLinkCopied(linkToCopy);
    }
  };

  return (
    <>
      <Menubar
        className={cn(`rounded-full bg-dark-300 border-none ${className}`)}
      >
        <MenubarMenu>
          <MenubarTrigger
            aria-label="Post options"
            className="cursor-pointer rounded-lg text-lg text-light-700 hover:text-light-900"
          >
            <BsThreeDotsVertical />
          </MenubarTrigger>
          <MenubarContent className="absolute -right-5 min-w-36 gap-10 rounded-lg border border-solid border-dark-400 bg-dark-300 p-2 shadow-xl shadow-dark-100/25">
            {POST_OPTIONS.map((item, index) => (
              <React.Fragment key={index}>
                {isOwnPost === item.isOwnPost &&
                  !(postType === "SHARELINK" && index === 0) && (
                    <MenubarItem
                      className={`${
                        item.isRed
                          ? "fill-custom-200 text-custom-200"
                          : "fill-light-600 text-light-600"
                      } w-full cursor-pointer gap-3 rounded bg-dark-300 text-base hover:bg-dark-400 hover:fill-light-900 hover:text-light-900`}
                      onClick={() => handlePostOptionClick(item.id)}
                    >
                      {item.height ? (
                        <item.icon height={item.height} width={item.height} />
                      ) : (
                        <item.icon />
                      )}

                      <p className="text-xs">
                        {index === 0
                          ? isPinned
                            ? "Remove Pin"
                            : "Pin on Profile"
                          : item.id === 2 && postType === "SHARELINK"
                            ? "Edit Shared Content"
                            : item.name}
                      </p>
                    </MenubarItem>
                  )}
              </React.Fragment>
            ))}
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <AlertDialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!deleting) setConfirmDelete(open);
        }}
      >
        <AlertDialogContent className="rounded-2xl border-dark-300 bg-dark-250 text-light-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This post will be moved to Recently Deleted. You can restore it
              from Settings → Your Activity → Recently Deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-red-500">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting..." : "Delete post"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostOptions;
