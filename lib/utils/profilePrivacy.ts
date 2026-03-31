type VisibilityValue = "NO_ONE" | "FOLLOW" | "EVERY_ONE" | string | undefined;

function getPrivacySource(userData: any) {
  return userData?.privacySettings || userData?.privacy || userData?.profilePrivacy || {};
}

export function canViewBooleanField(
  userData: any,
  key: string,
  isOwnProfile: boolean
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
  isOwnProfile: boolean
) {
  if (isOwnProfile) {
    return true;
  }

  const privacy = getPrivacySource(userData);
  const value = privacy?.[key] as VisibilityValue;

  if (!value) {
    return true;
  }

  if (value === "NO_ONE") {
    return false;
  }

  if (value === "FOLLOW") {
    return Boolean(userData?.isFollowing);
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

export function getProfileVisibilityState(userData: any, isOwnProfile: boolean) {
  return {
    canViewProfile: canViewByVisibility(userData, "profileView", isOwnProfile),
    canViewPosts: canViewByVisibility(userData, "postView", isOwnProfile),
    canViewSharedPosts: canViewByVisibility(userData, "postShare", isOwnProfile),
    canViewFollowers: canViewByVisibility(userData, "followers", isOwnProfile),
    canViewFollowings: canViewByVisibility(userData, "followings", isOwnProfile),
    canViewProfileRatings: canViewByVisibility(userData, "profileRating", isOwnProfile),
    canRatePosts: canViewByVisibility(userData, "postRating", isOwnProfile),
    canCommentOnPosts: canViewByVisibility(userData, "postComments", isOwnProfile),
    canReceiveMessages: isOwnProfile
      ? true
      : canViewBooleanField(userData, "messageRequest", isOwnProfile),
  };
}
