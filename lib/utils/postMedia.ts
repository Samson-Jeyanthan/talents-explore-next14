export const MAX_POST_FILE_BYTES = 1_000_000_000;
export const MAX_POST_VIDEO_SECONDS = 600;

export function validatePostFile(file: Pick<File, "size" | "type">) {
  if (!file.size || !Number.isFinite(file.size))
    throw new Error("The selected file is empty or unavailable.");
  if (file.size > MAX_POST_FILE_BYTES)
    throw new Error("Each media file must be 1 GB or smaller.");
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
    !file.type.startsWith("video/")
  ) {
    throw new Error(
      "Choose a JPEG, PNG, WebP image, or a video supported by your browser.",
    );
  }
}

export function validatePostDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0)
    throw new Error(
      "Unable to check video duration. Please choose another video.",
    );
  if (seconds > MAX_POST_VIDEO_SECONDS)
    throw new Error("Videos must be 10 minutes or shorter.");
}

/** Decode the real file before upload; picker metadata alone is not trusted. */
export async function createVideoThumbnail(
  file: File,
  checks = { file: validatePostFile, duration: validatePostDuration },
): Promise<File> {
  checks.file(file);
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  try {
    return await new Promise<File>((resolve, reject) => {
      const timer = window.setTimeout(
        () =>
          fail(new Error("Video preview timed out. Please try another file.")),
        30000,
      );
      const finish = () => {
        clearTimeout(timer);
        video.onloadedmetadata = null;
        video.onloadeddata = null;
        video.onseeked = null;
        video.onerror = null;
      };
      const fail = (error: Error) => {
        finish();
        reject(error);
      };
      let captured = false;
      const capture = () => {
        if (captured) return;
        captured = true;
        try {
          checks.duration(video.duration);
          if (!video.videoWidth || !video.videoHeight)
            throw new Error("Unable to preview this video.");
          const canvas = document.createElement("canvas");
          const scale = Math.min(
            1,
            1280 / Math.max(video.videoWidth, video.videoHeight),
          );
          canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
          canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
          const context = canvas.getContext("2d");
          if (!context)
            throw new Error(
              "Video previews are not supported by this browser.",
            );
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                fail(new Error("Unable to generate a video thumbnail."));
                return;
              }
              finish();
              resolve(
                new File([blob], "video-thumbnail.jpg", { type: "image/jpeg" }),
              );
            },
            "image/jpeg",
            0.85,
          );
        } catch (error) {
          fail(
            error instanceof Error
              ? error
              : new Error("Unable to preview this video."),
          );
        }
      };
      video.onloadedmetadata = () => {
        try {
          checks.duration(video.duration);
        } catch (error) {
          fail(error as Error);
        }
      };
      video.onloadeddata = () => {
        const time = Math.min(1, video.duration / 2);
        video.onseeked = capture;
        video.currentTime = time;
      };
      video.onerror = () =>
        fail(
          new Error(
            "This video cannot be decoded by your browser. Try an MP4 with H.264 video.",
          ),
        );
      video.src = url;
    });
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

export function createPostVideoThumbnail(file: File): Promise<File> {
  return createVideoThumbnail(file);
}
