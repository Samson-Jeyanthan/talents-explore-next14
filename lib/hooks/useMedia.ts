import { ChangeEvent, useState } from "react";
import { Media } from "@/types/utils.types";

export const defaultMediaState: Media = {
  data: null,
  preview: "",
  fileType: null,
  fileName: null,
  mediaType: "",
};

const imageTypes = ["image/jpeg", "image/png", "image/webp"];

const maxFileSize = 8 * 1024 * 1024;

export function useMediaSelection(isImageOnly: boolean) {
  const [error, setError] = useState("");
  const [media, setMedia] = useState<Media>(defaultMediaState);

  const handleMediaInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = imageTypes.includes(file.type);
    const isPdf = file.type === "application/pdf";

    if (!isImage && (isImageOnly || !isPdf)) {
      setError(
        isImageOnly
          ? "Choose a JPEG, PNG, or WebP image."
          : "Choose a JPEG, PNG, WebP image, or PDF."
      );
      e.target.value = "";
      return;
    }

    if (file.size > maxFileSize) {
      setError(`${file.name} is too large. The maximum allowed size is 8 MB.`);
      e.target.value = "";
      return;
    }

    setError("");
    setMedia({
      data: file,
      preview: URL.createObjectURL(file),
      fileType: file.type,
      fileName: file.name,
      mediaType: isPdf ? "pdf" : "image",
    });
  };

  const resetMedia = () => {
    if (media.preview) {
      URL.revokeObjectURL(media.preview);
    }

    setMedia(defaultMediaState);
    setError("");
  };

  return {
    media,
    error,
    handleMediaInput,
    resetMedia,
    setError,
    setMedia,
  };
}
