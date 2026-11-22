import policies from "@/content/legal/policies.json";

// Policy copy imported from talents-explore-static, development@1b5253d.
// This is trusted bundled content, never user-supplied HTML.
// Intellectual Property, Cookies, Branded Content and Child Safety were copied
// from talentsexplore.com, published bundle main.7d19f9f6.js, on 22 November 2026.

export { PUBLIC_POLICY_LINKS, PUBLIC_SITE_LINKS } from "./legal-links";

export type PolicyDocument = {
  title: string;
  introduction: string;
  sections: { id: string; title: string; html: string }[];
};
export const POLICY_DOCUMENTS: Record<string, PolicyDocument> = policies;
export const UNPUBLISHED_POLICIES: Record<string, string> = {
  "music-terms": "Music Terms",
  "business-terms": "Business Terms",
};

export function publicPolicyTitle(slug: string) {
  return (
    getPolicyDocument(slug)?.title ||
    (Object.hasOwn(UNPUBLISHED_POLICIES, slug)
      ? UNPUBLISHED_POLICIES[slug]
      : undefined)
  );
}

export function getPolicyDocument(slug: string) {
  return Object.hasOwn(POLICY_DOCUMENTS, slug)
    ? POLICY_DOCUMENTS[slug]
    : undefined;
}
