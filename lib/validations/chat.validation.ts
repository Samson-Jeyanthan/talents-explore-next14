import { z } from "zod";

const webUrl = z
  .string()
  .url()
  .refine(
    (value) => /^https?:\/\//i.test(value),
    "Use an HTTP or HTTPS media URL.",
  );
export const chatMessageValidation = z
  .object({
    roomId: z.string().trim().min(1, "A conversation is required."),
    content: z.string().trim().nullish(),
    colorCode: z.string().nullish(),
    mediaType: z.enum(["image", "video", "link", "gif"]).nullish(),
    media: webUrl.nullish(),
    url: webUrl.nullish(),
    videoThumbnail: webUrl.nullish(),
  })
  .superRefine((data, ctx) => {
    if (!data.content && !data.media && !data.url)
      ctx.addIssue({
        code: "custom",
        message: "Please enter a message or select an attachment.",
      });
    if (data.media && !data.mediaType)
      ctx.addIssue({
        code: "custom",
        path: ["mediaType"],
        message: "The attachment type is missing.",
      });
    if (["image", "video", "gif"].includes(data.mediaType || "") && !data.media)
      ctx.addIssue({
        code: "custom",
        path: ["media"],
        message: "The attachment is missing.",
      });
    if (data.mediaType === "video" && !data.videoThumbnail)
      ctx.addIssue({
        code: "custom",
        path: ["videoThumbnail"],
        message: "The video preview is missing. Please select the video again.",
      });
  });

export type ChatMessageInput = z.infer<typeof chatMessageValidation>;
