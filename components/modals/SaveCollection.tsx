"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "../ui/dialog";
import { PostUtilsButton } from "../buttons";
import type { ISavedFolder } from "@/types/post.types";
import SavedListCard from "../cards/SavedListCard";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import {
  getSavedFoldersAction,
  createSaveCollectionFolderAction,
} from "@/actions/save.action";

export default function SaveCollection({
  postId,
  buttonClassName,
}: {
  postId: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<ISavedFolder[]>([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [createError, setCreateError] = useState("");
  const generation = useRef(0);
  const readVersion = useRef(0);
  const inFlight = useRef(false);
  const editVersion = useRef(0);
  const edits = useRef(new Map<string, { version: number; saved: boolean }>());
  const refresh = useCallback(async () => {
    const current = generation.current;
    const requestId = ++readVersion.current;
    const started = editVersion.current;
    setLoading(true);
    setLoadError("");
    try {
      const result = await getSavedFoldersAction(postId);
      if (current !== generation.current || requestId !== readVersion.current)
        return;
      if (!result.success) {
        setLoadError(result.message);
        return;
      }
      setFolders(
        result.data.map((folder) => {
          const edit = edits.current.get(folder._id);
          return edit && edit.version > started
            ? { ...folder, status: edit.saved }
            : folder;
        }),
      );
    } catch {
      if (current === generation.current && requestId === readVersion.current)
        setLoadError("Unable to load collections. Please try again.");
    } finally {
      if (current === generation.current && requestId === readVersion.current)
        setLoading(false);
    }
  }, [postId]);
  useEffect(() => {
    if (!open) return;
    const sessionGeneration = generation;
    const sessionReadVersion = readVersion;
    generation.current++;
    edits.current.clear();
    editVersion.current = 0;
    setFolders([]);
    refresh();
    return () => {
      sessionGeneration.current++;
      sessionReadVersion.current++;
    };
  }, [open, refresh]);

  async function create() {
    if (inFlight.current || !name.trim()) return;
    inFlight.current = true;
    setCreating(true);
    setCreateError("");
    try {
      const result = await createSaveCollectionFolderAction("", name.trim());
      if (result?.status !== "7400") {
        setCreateError(
          result?.message ||
            (result?.status === "7407"
              ? "This collection name already exists."
              : "Unable to create the collection. Please try again."),
        );
        return;
      }
      setName("");
      toast.success("Collection created");
      await refresh();
    } catch {
      setCreateError(
        "Unable to create the collection. Your name has been kept; please try again.",
      );
    } finally {
      inFlight.current = false;
      setCreating(false);
    }
  }
  const displayedGeneration = generation.current;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!inFlight.current) setOpen(next);
      }}
    >
      <DialogTrigger aria-label="Save post to collection">
        <PostUtilsButton buttonFor="SAVE" className={buttonClassName} />
      </DialogTrigger>
      <DialogContent
        className="flex max-h-[85dvh] w-[calc(100vw-2rem)] max-w-md flex-col gap-4 rounded-2xl border border-dark-400 bg-dark-250 p-4 text-light-900"
        aria-describedby={undefined}
      >
        <div className="flex items-center justify-between">
          <DialogTitle className="text-xl font-semibold">
            Save to collection
          </DialogTitle>
          <DialogClose asChild>
            <button
              type="button"
              disabled={creating}
              aria-label="Close saved collections"
              className="rounded-full p-2 hover:bg-dark-300"
            >
              <X className="size-5" />
            </button>
          </DialogClose>
        </div>
        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          {folders
            .slice()
            .reverse()
            .map((folder) => (
              <SavedListCard
                key={folder._id}
                collectionId={folder._id}
                collectionName={folder.collectionName}
                postId={postId}
                postStatus={folder.status}
                onChanged={(saved) => {
                  if (displayedGeneration !== generation.current) return;
                  edits.current.set(folder._id, {
                    version: ++editVersion.current,
                    saved,
                  });
                  setFolders((current) =>
                    current.map((item) =>
                      item._id === folder._id
                        ? { ...item, status: saved }
                        : item,
                    ),
                  );
                }}
              />
            ))}
          {loading && (
            <p role="status" className="text-sm text-light-500">
              Loading collections...
            </p>
          )}
          {!loading && !loadError && !folders.length && (
            <p className="text-sm text-light-500">
              No collections yet. Create one below.
            </p>
          )}
          {loadError && (
            <div
              role="alert"
              className="flex flex-col gap-2 text-sm text-red-500"
            >
              <p>{loadError}</p>
              <Button
                type="button"
                disabled={loading}
                className="shad-button_secondary"
                onClick={refresh}
              >
                Try again
              </Button>
            </div>
          )}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            create();
          }}
          className="flex shrink-0 flex-col gap-2 border-t border-dark-400 pt-3"
        >
          <label
            htmlFor={`collection-name-${postId}`}
            className="text-xs font-medium text-light-700"
          >
            New collection
          </label>
          <div className="flex items-center gap-2">
            <Input
              id={`collection-name-${postId}`}
              value={name}
              disabled={creating}
              onChange={(event) => setName(event.target.value)}
              placeholder="Collection name"
              className="shad-form-input min-w-0"
            />
            <Button
              type="submit"
              disabled={creating || !name.trim()}
              className="shad-button_primary"
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>
          {createError && (
            <p role="alert" className="text-sm text-red-500">
              {createError}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
