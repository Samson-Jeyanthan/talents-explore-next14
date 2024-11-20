import { Media } from "@/types/utils.types";
import { ChangeEvent, useState } from "react";

export const defaultMediaState: Media = {
  data: null,
  preview: "",
  fileType: null,
  fileName: null,
  mediaType: "",
};

export function useImageSelection() {
  const [error, setError] = useState("");
  const [media, setMedia] = useState<Media>(defaultMediaState);

  const handleImageInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
        file.type
      )
    ) {
      setError(
        "Invalid file type. Please choose a file in JPEG, JPG, PNG or WEB format and try again."
      );
      return;
    }

    if (file.size > 1024 * 1024 * 8) {
      setError(
        `${file.name} is too large, maximum 8mb allowed. Please select another image or compress it.`
      );
      return;
    }

    setMedia({
      ...media,
      data: file,
      preview: URL.createObjectURL(file),
      fileType: file.type,
      fileName: file.name,
      mediaType: "image",
    });
  };

  return {
    media,
    error,
    handleImageInput,
    resetMedia: () => setMedia(defaultMediaState),
    setError,
    setMedia,
  };
}
