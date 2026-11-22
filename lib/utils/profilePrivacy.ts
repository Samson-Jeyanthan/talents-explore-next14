import { followFlag } from "./connections";

type VisibilityValue = "NO_ONE" | "FOLLOW" | "EVERY_ONE" | string | undefined;

function getPrivacySource(userData: any) {
  return (
    userData?.privacySettings ||
    userData?.privacy ||
    userData?.profilePrivacy ||
    {}
  );
}

export function canViewBooleanField(
  userData: any,
  key: string,
  isOwnProfile: boolean,
) {
  if (isOwnProfile) {
    return true;
  }

  const privacy = getPrivacySource(userData);
  const value = privacy?.[key];

  if (typeof value === "boolean") {
    return value;
  }

  return true;
}

export function canViewByVisibility(
  userData: any,
  key: string,
  isOwnProfile: boolean,
) {
  if (isOwnProfile) {
    return true;
  }

  const privacy = getPrivacySource(userData);
  const permissionKeys: Record<string, string[]> = {
    followers: ["canViewFollowers", "canSeeFollowers"],
    followings: ["canViewFollowing", "canViewFollowings", "canSeeFollowing"],
    profileRating: ["canViewProfileRatings", "canViewRatings"],
    postRating: ["canRatePosts", "canRatePost"],
  };
  for (const name of permissionKeys[key] || []) {
    const permission = userData?.permissions?.[name];
    if (permission !== undefined && permission !== null)
      return followFlag(permission);
  }
  const value = (
    permissionKeys[key]
      ? userData?.permissions?.[key] ??
        privacy?.[key] ??
        userData?.[`${key}Visibility`]
      : privacy?.[key]
  ) as VisibilityValue;

  if (!value) {
    return true;
  }

  if (value === "NO_ONE") {
    return false;
  }

  if (value === "FOLLOW") {
    return followFlag(userData?.isFollowing);
  }

  return true;
}

export function getVisibleSocialLinks(userData: any, isOwnProfile: boolean) {
  const links = userData?.morePersonalInfo?.socialLinks || [];

  if (isOwnProfile) {
    return links;
  }

  return links.filter((link: any) => link?.show !== false);
}

export function getProfileVisibilityState(
  userData: any,
  isOwnProfile: boolean,
) {
  const canViewProfile = canViewByVisibility(
    userData,
    "profileView",
    isOwnProfile,
  );
  return {
    canViewProfile,
    canViewSharedLinks:
      isOwnProfile ||
      (canViewProfile &&
        followFlag(
          userData?.permissions?.canShare ??
            userData?.canShare ??
            userData?.isTalent,
        )),
    canViewPosts: canViewByVisibility(userData, "postView", isOwnProfile),
    canViewSharedPosts: canViewByVisibility(
      userData,
      "postShare",
      isOwnProfile,
    ),
    canViewFollowers: canViewByVisibility(userData, "followers", isOwnProfile),
    canViewFollowings: canViewByVisibility(
      userData,
      "followings",
      isOwnProfile,
    ),
    canViewProfileRatings: canViewByVisibility(
      userData,
      "profileRating",
      isOwnProfile,
    ),
    canRateProfile:
      isOwnProfile ||
      (userData?.permissions?.canRateProfile != null
        ? followFlag(userData.permissions.canRateProfile)
        : canViewByVisibility(userData, "profileRating", isOwnProfile)),
    canRatePosts: canViewByVisibility(userData, "postRating", isOwnProfile),
    canCommentOnPosts: canViewByVisibility(
      userData,
      "postComments",
      isOwnProfile,
    ),
    canReceiveMessages: isOwnProfile
      ? true
      : canViewBooleanField(userData, "messageRequest", isOwnProfile),
  };
}
