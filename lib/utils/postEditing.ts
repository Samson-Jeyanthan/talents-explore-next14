import type { z } from "zod";
import type { createPostShareValidation } from "@/lib/validations/post.validation";

export type EditablePost = Record<string, any> & { _id: string };

export function getPostType(post: EditablePost): "POST" | "SHARELINK" {
  const type = post.type || post.media?.[0]?.type;
  if (type === "POST" || type === "SHARELINK") return type;
  return post.website ? "SHARELINK" : "POST";
}

function taggedPerson(person: any) {
  if (typeof person === "string")
    return { _id: person, firstName: person, lastName: "", profileImage: "" };
  const details = person?.personalInfo || person || {};
  return {
    _id: person?._id || "",
    firstName: details.firstName || details.name || person?.userName || "",
    lastName: details.lastName || "",
    profileImage: details.profileImage || "",
  };
}

export function getPostEditValues(
  post: EditablePost,
): z.infer<typeof createPostShareValidation> {
  const about = post.about || {};
  const thumb = post.shareLinkThumbnail;
  return {
    media: (Array.isArray(post.media)
      ? post.media
      : post.media
        ? [post.media]
        : []
    ).map((asset: any) => ({
      mediaType: asset.mediaType,
      croppedPrev: asset.url,
      thumbnailPreview: asset.thumbnailUrl || undefined,
      originalAsset: {
        mediaType: asset.mediaType,
        url: asset.url,
        urlKey: asset.urlKey,
        thumbnailUrl: asset.thumbnailUrl,
        thumbnailUrlkey: asset.thumbnailUrlkey,
      },
    })),
    title: about.title || "",
    description: about.description || "",
    ownRating: Number(about.ownRating || 0),
    mainCategory: about.mainCategoryId || "",
    subCategory: about.subCategoryId || "",
    skill: about.skillId || null,
    skillLevel: about.level || null,
    primaryLanguage:
      about.primaryLanguageId || about.primaryLanguage?._id || "",
    secondaryLanguage:
      about.secondaryLanguageId || about.secondaryLanguage?._id || "",
    country: about.country || "",
    state: about.state || "",
    peopleTag: (about.peopleTag || []).map(taggedPerson),
    keywords: Array.isArray(about.keywords)
      ? about.keywords.join(" ")
      : about.keywords || "",
    isCreditWork: post.isCreditWork ? "true" : "false",
    credit: (post.credit || []).map((credit: any) => ({
      creditTitle: credit.creditTitle || "",
      peopleTag: (credit.peopleTag || []).map(taggedPerson),
    })),
    productionName: about.productionName || "",
    productionDate: about.productionDate || "",
    toolsUsed: (post.toolsUsed || []).map((tool: any) => ({
      toolName: tool.toolName || "",
      level:
        typeof tool.level === "string" ? tool.level : tool.level?.value || "",
    })),
    website:
      typeof post.website === "string"
        ? post.website
        : post.website?.searchUrl || post.website?.url || "",
    shareLinkThumbnail:
      typeof thumb === "string"
        ? thumb
        : thumb
          ? { url: thumb.url, urlKey: thumb.urlKey ?? thumb.key }
          : null,
  };
}
