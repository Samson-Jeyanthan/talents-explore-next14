export type SharedPost = { id: string; title: string };
type PostShareData = { title: string; url: string };
type ShareBrowser = {
  share?: (data: PostShareData) => Promise<void>;
  canShare?: (data: PostShareData) => boolean;
  clipboard?: { writeText: (text: string) => Promise<void> };
};

export function readSharedPost(
  params: Record<string, string | string[] | undefined>,
): SharedPost | undefined {
  if (
    typeof params.sharePost !== "string" ||
    !/^[a-f\d]{24}$/i.test(params.sharePost)
  )
    return;
  return {
    id: params.sharePost,
    title:
      typeof params.shareTitle === "string"
        ? params.shareTitle.trim().slice(0, 300) || "Talents Explore post"
        : "Talents Explore post",
  };
}

export function postShareParams(post: SharedPost) {
  return new URLSearchParams({
    sharePost: post.id,
    shareTitle: post.title,
  }).toString();
}

export function getPostShareData(origin: string, post: SharedPost) {
  if (!/^[a-f\d]{24}$/i.test(post.id))
    throw new Error("This post cannot be shared.");
  const base = new URL(origin);
  if (!["http:", "https:"].includes(base.protocol))
    throw new Error("This post cannot be shared.");
  return {
    title: post.title.trim().slice(0, 300) || "Talents Explore post",
    url: `${base.origin}/post/${post.id}`,
  };
}

export async function copyPostLink(
  url: string,
  browser: ShareBrowser,
): Promise<"copied" | "manual"> {
  try {
    if (!browser.clipboard?.writeText) return "manual";
    await browser.clipboard.writeText(url);
    return "copied";
  } catch {
    return "manual";
  }
}

export async function sharePostLink(
  data: { title: string; url: string },
  browser: ShareBrowser,
): Promise<"shared" | "cancelled" | "copied" | "manual"> {
  try {
    if (browser.share && (!browser.canShare || browser.canShare(data))) {
      await browser.share(data);
      return "shared";
    }
  } catch (error) {
    // Dismissing the native chooser is an ordinary cancellation.
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "AbortError"
    )
      return "cancelled";
  }
  return copyPostLink(data.url, browser);
}

export function sharedPostDraft(origin: string, post: SharedPost) {
  const data = getPostShareData(origin, post);
  return `${data.title}\n${data.url}`;
}

export function removeShareParams(href: string) {
  const url = new URL(href);
  url.searchParams.delete("sharePost");
  url.searchParams.delete("shareTitle");
  return `${url.pathname}${url.search}${url.hash}`;
}
