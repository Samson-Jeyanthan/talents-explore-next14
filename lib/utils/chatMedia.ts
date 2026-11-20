import { createVideoThumbnail } from "./postMedia";
import type { UploadedFile } from "./uploadFile";

export type ChatAttachment = {
  file: File;
  mediaType: "image" | "video";
  preview: string;
  thumbnail?: File;
  thumbnailPreview?: string;
};

export function validateChatFile(file: Pick<File, "size" | "type">) {
  if (!Number.isFinite(file.size) || file.size <= 0)
    throw new Error("The selected file is empty or unavailable.");
  if (
    !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
      file.type,
    ) &&
    !file.type.startsWith("video/")
  ) {
    throw new Error(
      "Choose a JPEG, PNG, WebP, GIF image, or a browser-supported video.",
    );
  }
}

export async function prepareChatAttachment(
  file: File,
): Promise<ChatAttachment> {
  validateChatFile(file);
  if (file.type.startsWith("video/")) {
    // Mobile defines no chat-specific duration/size cap. Post limits stay separate.
    const thumbnail = await createVideoThumbnail(file, {
      file: validateChatFile,
      duration: (seconds) => {
        if (!Number.isFinite(seconds) || seconds <= 0)
          throw new Error(
            "Unable to check this video. Please choose another file.",
          );
      },
    });
    return {
      file,
      mediaType: "video",
      preview: URL.createObjectURL(file),
      thumbnail,
      thumbnailPreview: URL.createObjectURL(thumbnail),
    };
  }
  const preview = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(() => {
        cleanup();
        reject(
          new Error("Image preview timed out. Please choose another file."),
        );
      }, 15000);
      const cleanup = () => {
        clearTimeout(timer);
        image.onload = null;
        image.onerror = null;
      };
      image.onload = () => {
        cleanup();
        if (image.naturalWidth > 0) resolve();
        else reject(new Error("Unable to preview this image."));
      };
      image.onerror = () => {
        cleanup();
        reject(
          new Error(
            "This image cannot be decoded. Please choose another file.",
          ),
        );
      };
      image.src = preview;
    });
    return { file, mediaType: "image", preview };
  } catch (error) {
    URL.revokeObjectURL(preview);
    throw error;
  }
}

export function releaseChatAttachment(attachment: ChatAttachment) {
  URL.revokeObjectURL(attachment.preview);
  if (attachment.thumbnailPreview)
    URL.revokeObjectURL(attachment.thumbnailPreview);
}

export async function uploadChatAttachment(
  attachment: ChatAttachment,
  upload: (file: File, label: string) => Promise<UploadedFile>,
  cache: WeakMap<File, UploadedFile>,
) {
  if (attachment.mediaType === "video" && !attachment.thumbnail)
    throw new Error(
      "The video preview is missing. Please select the video again.",
    );
  async function cached(file: File, label: string) {
    const previous = cache.get(file);
    if (previous) return previous;
    const result = await upload(file, label);
    cache.set(file, result);
    return result;
  }
  const media = await cached(attachment.file, "Uploading attachment");
  const thumbnail = attachment.thumbnail
    ? await cached(attachment.thumbnail, "Uploading video preview")
    : null;
  return {
    mediaType: attachment.mediaType,
    media: media.url,
    videoThumbnail: thumbnail?.url || null,
  };
}
