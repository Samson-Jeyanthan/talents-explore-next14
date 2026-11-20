"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  chatMessageValidation,
  ChatMessageInput,
} from "@/lib/validations/chat.validation";
import {
  ChatAttachment,
  prepareChatAttachment,
  releaseChatAttachment,
  uploadChatAttachment,
} from "@/lib/utils/chatMedia";
import { UploadedFile, uploadFileToStorage } from "@/lib/utils/uploadFile";
import {
  removeShareParams,
  sharedPostDraft,
  SharedPost,
} from "@/lib/utils/postSharing";

type Props = {
  roomId: string;
  userName: string;
  onSend: (
    payload: ChatMessageInput,
  ) => Promise<{ success: boolean; message?: string }>;
  onTyping: (typing: boolean) => void;
  sharedPost?: SharedPost;
};

export default function ChatComposer({
  roomId,
  userName,
  onSend,
  onTyping,
  sharedPost,
}: Props) {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const selecting = useRef(false);
  const uploads = useRef(new WeakMap<File, UploadedFile>());
  const shareConsumed = useRef(false);
  useEffect(() => {
    if (!sharedPost || shareConsumed.current) return;
    shareConsumed.current = true;
    setMessage(
      (current) =>
        current || sharedPostDraft(window.location.origin, sharedPost),
    );
    window.history.replaceState(
      window.history.state,
      "",
      removeShareParams(window.location.href),
    );
  }, [sharedPost]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(
    () => () => {
      if (attachment) releaseChatAttachment(attachment);
    },
    [attachment],
  );

  async function selectAttachment(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || selecting.current || inFlight.current) return;
    selecting.current = true;
    setPreparing(true);
    setError("");
    try {
      const next = await prepareChatAttachment(file);
      if (!mounted.current) {
        releaseChatAttachment(next);
        return;
      }
      setAttachment(next);
    } catch (error) {
      if (mounted.current)
        setError(
          error instanceof Error
            ? error.message
            : "Unable to preview this attachment.",
        );
    } finally {
      selecting.current = false;
      if (mounted.current) setPreparing(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (
      inFlight.current ||
      selecting.current ||
      (!message.trim() && !attachment)
    )
      return;
    inFlight.current = true;
    setSending(true);
    setError("");
    setProgress("Preparing message...");
    onTyping(false);
    try {
      const media = attachment
        ? await uploadChatAttachment(
            attachment,
            (file, label) => {
              if (mounted.current) setProgress(label);
              return uploadFileToStorage(file, "chat", userName, (percent) => {
                if (mounted.current) setProgress(`${label}: ${percent}%`);
              });
            },
            uploads.current,
          )
        : {};
      if (!mounted.current) return;
      const payload = chatMessageValidation.parse({
        roomId,
        content: message.trim() || null,
        ...media,
      });
      setProgress("Sending message...");
      const result = await onSend(payload);
      if (!mounted.current) return;
      if (!result.success) {
        setError(
          result.message || "Unable to send your message. Please try again.",
        );
        return;
      }
      setMessage("");
      setAttachment(null);
    } catch (error) {
      if (mounted.current)
        setError(
          error instanceof Error
            ? error.message
            : "Unable to send your message. Please try again.",
        );
    } finally {
      inFlight.current = false;
      if (mounted.current) {
        setSending(false);
        setProgress("");
      }
    }
  }

  return (
    <form
      onSubmit={submit}
      className="border-t border-dark-300 bg-dark-250 p-4"
      aria-label="Message composer"
      aria-busy={sending || preparing}
    >
      <input
        type="file"
        ref={input}
        accept="image/jpeg,image/png,image/webp,image/gif,video/*"
        onChange={selectAttachment}
        disabled={sending || preparing}
        hidden
        aria-label="Choose chat attachment"
      />
      {attachment && (
        <div className="relative mb-3 w-fit max-w-full rounded-xl border border-dark-300 p-2">
          {attachment.mediaType === "video" ? (
            <video
              src={attachment.preview}
              poster={attachment.thumbnailPreview}
              controls
              playsInline
              preload="metadata"
              className="max-h-48 max-w-full rounded-lg"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={attachment.preview}
              alt="Attachment preview"
              className="max-h-48 max-w-full rounded-lg"
            />
          )}
          <p className="max-w-64 truncate py-1 pr-8 text-xs text-light-500">
            {attachment.file.name}
          </p>
          <Button
            type="button"
            aria-label="Remove attachment"
            disabled={sending || preparing}
            className="absolute right-1 top-1 rounded-full bg-dark-200 p-2 text-light-900"
            onClick={() => {
              setAttachment(null);
              setError("");
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
      {(preparing || sending) && (
        <p role="status" className="mb-2 text-sm text-light-500">
          {preparing ? "Preparing attachment preview..." : progress}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-2 text-sm text-red-500">
          {error}
        </p>
      )}
      <div className="flex items-end gap-3">
        <Button
          type="button"
          aria-label="Attach image or video"
          disabled={sending || preparing}
          className="rounded-full bg-dark-200 p-3 text-light-900"
          onClick={() => input.current?.click()}
        >
          <Paperclip className="size-5" />
        </Button>
        <textarea
          aria-label={attachment ? "Attachment caption" : "Message"}
          value={message}
          disabled={sending || preparing}
          onChange={(event) => {
            setMessage(event.target.value);
            onTyping(Boolean(event.target.value.trim()));
          }}
          onBlur={() => onTyping(false)}
          placeholder={
            attachment ? "Add a caption (optional)" : "Type a message"
          }
          rows={1}
          className="min-h-12 min-w-0 flex-1 resize-none rounded-[22px] border border-dark-300 bg-dark-200 px-4 py-3 text-sm text-light-900 outline-none placeholder:text-light-500 focus:border-primary-500"
        />
        <Button
          type="submit"
          disabled={sending || preparing || (!message.trim() && !attachment)}
          className="rounded-full bg-primary-500 px-4 text-light-900"
        >
          <Send className="mr-2 size-4" />
          {sending ? "Sending..." : "Send"}
        </Button>
      </div>
    </form>
  );
}
