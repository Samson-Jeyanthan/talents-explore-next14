import { getProfileVisibilityState } from "./profilePrivacy";

export function getProfileTabs(
  userData: any,
  isOwnProfile: boolean,
  username: string,
  userId: string,
) {
  const visibility = getProfileVisibilityState(userData, isOwnProfile);
  const base = `/profile/${encodeURIComponent(username)}/${userId}`;
  const tab = (title: string, value: string) => ({
    title,
    value,
    href: `${base}/${value}`,
  });
  return [
    tab("Overview", ""),
    ...(userData?.isTalent && visibility.canViewPosts
      ? [tab("All Posts", "all-posts")]
      : []),
    ...(visibility.canViewSharedLinks
      ? [tab("Shared Links", "shared-links")]
      : []),
    ...(userData?.isTalent && visibility.canViewSharedPosts
      ? [tab("Credits", "credits")]
      : []),
    ...(userData?.isTalent && visibility.canViewProfile
      ? [tab("Skills", "skills")]
      : []),
  ];
}
