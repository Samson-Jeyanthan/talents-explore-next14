"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { ShareIcon } from "@/public/assets/svgs";
import { cn } from "@/lib/utils";
import {
  copyPostLink,
  getPostShareData,
  postShareParams,
  sharePostLink,
} from "@/lib/utils/postSharing";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SharePostButton({
  postId,
  title = "Talents Explore post",
  className,
  size = "18px",
}: {
  postId: string;
  title?: string;
  className?: string;
  size?: string;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ title: string; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);
  function onOpenChange(next: boolean) {
    if (next) {
      try {
        setData(
          getPostShareData(window.location.origin, { id: postId, title }),
        );
      } catch {
        toast.error("This post cannot be shared.");
        return;
      }
      setManual(false);
    }
    setOpen(next);
  }
  async function share(native: boolean) {
    if (!data || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setManual(false);
    try {
      const result = native
        ? await sharePostLink(data, navigator)
        : await copyPostLink(data.url, navigator);
      if (result === "copied") toast.success("Post link copied");
      if (result === "manual") {
        setManual(true);
        input.current?.focus();
        input.current?.select();
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Share post"
          title="Share post"
          className={cn(
            "flex items-center justify-center gap-2 rounded-full bg-dark-300 fill-light-900 text-xs font-normal text-light-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500",
            className,
          )}
        >
          <ShareIcon width={size} height={size} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] gap-4 rounded-2xl border border-dark-400 bg-dark-250 p-5 text-light-900 sm:max-w-md">
        <div className="flex items-center justify-between gap-3">
          <DialogTitle className="text-xl font-semibold">
            Share post
          </DialogTitle>
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close sharing"
              className="rounded-full p-2 hover:bg-dark-300"
            >
              <X className="size-5" />
            </button>
          </DialogClose>
        </div>
        <DialogDescription>
          Share this post in a TE conversation, with another app, or by copying
          its link.
        </DialogDescription>
        <p className="break-words text-sm font-medium">{data?.title}</p>
        {data && (
          <Button asChild className="shad-button_secondary justify-start">
            <Link
              href={`/chat?${postShareParams({ id: postId, title: data.title })}`}
              onClick={() => setOpen(false)}
            >
              <MessageSquare className="size-4" />
              Share in TE chat
            </Link>
          </Button>
        )}
        <Button
          type="button"
          disabled={busy}
          onClick={() => share(true)}
          className="shad-button_secondary justify-start"
        >
          <ExternalLink className="size-4" />
          Share to other apps
        </Button>
        <label
          className="text-xs text-light-700"
          htmlFor={`share-link-${postId}`}
        >
          Post link
        </label>
        <Input
          id={`share-link-${postId}`}
          aria-label="Post link"
          ref={input}
          value={data?.url || ""}
          readOnly
          onFocus={(event) => event.target.select()}
          className="shad-form-input"
        />
        <Button
          type="button"
          disabled={busy}
          onClick={() => share(false)}
          className="shad-button_primary"
        >
          <Copy className="size-4" />
          {busy ? "Please wait..." : "Copy link"}
        </Button>
        {manual && (
          <p role="status" className="text-sm text-light-700">
            Automatic copying is unavailable. Select and copy the post link
            above.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
