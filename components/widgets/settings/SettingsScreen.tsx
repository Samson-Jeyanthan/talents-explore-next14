"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  changePasswordSettingsAction,
  deactivateAccountSettingsAction,
  deleteAccountSettingsAction,
  getSettingsActivityFeedAction,
  permanentlyDeletePostSettingsAction,
  restoreDeletedPostSettingsAction,
  updateNotificationSettingsAction,
  updatePrivacySettingsAction,
  updateSocialLinksPrivacyAction,
} from "@/actions/settings.action";
import { deleteToken } from "@/actions/auth.action";
import { handleClearStorage } from "@/lib/functions/auth.functions";
import { INITIAL_USER, useUserContext } from "@/context/AuthProvider";

type Props = {
  slugPath: string;
  currentUser: any;
  initialPrivacy: any;
  initialNotification: any;
};

type VisibilityValue = "NO_ONE" | "FOLLOW" | "EVERY_ONE";
type ActivityMode = "deleted-post" | "deleted-share" | "star-post" | "star-share";
type ActivityCollectionKey = "deletedPost" | "deletedShare" | "starPost" | "starShare";
type ConfirmAccountAction = "" | "deactivate" | "delete";

type ActivityCollections = {
  deletedPost: any[];
  deletedShare: any[];
  starPost: any[];
  starShare: any[];
};

type ActivityLoading = Record<ActivityCollectionKey, boolean>;

type NotificationState = {
  pushNotofication: boolean;
  quiteMode: boolean;
  quiteModeStartTime?: string | null;
  quiteModeEndTime?: string | null;
};

const SETTINGS_LINKS = [
  { href: "/settings", label: "Settings Home" },
  { href: "/settings/account-centre", label: "Account Centre" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/privacy", label: "Profile Privacy" },
  { href: "/settings/activity", label: "Your Activity" },
];

const PRIVACY_LINKS = [
  { href: "/settings/privacy/profile", label: "Profile" },
  { href: "/settings/privacy/comments-tags", label: "Comments and Tags" },
  { href: "/settings/privacy/star-ratings", label: "Star Ratings" },
  { href: "/settings/privacy/following-followers", label: "Following and Followers" },
  { href: "/settings/privacy/messages", label: "Messages" },
];

const VISIBILITY_OPTIONS: { value: VisibilityValue; label: string; description: string }[] = [
  { value: "NO_ONE", label: "No one", description: "Keep this detail private from everyone." },
  { value: "FOLLOW", label: "Followers", description: "Only people in your network can see this." },
  { value: "EVERY_ONE", label: "Everyone", description: "Anyone can view this detail on your profile." },
];

const MESSAGE_REQUEST_OPTIONS = [
  { value: true, label: "On", description: "Allow new message requests from other users." },
  { value: false, label: "Off", description: "Turn off incoming message requests." },
];

const ACTIVITY_TABS = [
  { key: "post", label: "Post" },
  { key: "shared", label: "Shared" },
] as const;

function normalizeNotification(initialNotification: any): NotificationState {
  return {
    pushNotofication: Boolean(initialNotification?.pushNotofication),
    quiteMode: Boolean(initialNotification?.quiteMode),
    quiteModeStartTime: initialNotification?.quiteModeStartTime || "",
    quiteModeEndTime: initialNotification?.quiteModeEndTime || "",
  };
}

function normalizePrivacy(initialPrivacy: any) {
  return {
    firstName: Boolean(initialPrivacy?.firstName),
    lastName: Boolean(initialPrivacy?.lastName),
    gender: Boolean(initialPrivacy?.gender),
    dob: Boolean(initialPrivacy?.dob),
    location: Boolean(initialPrivacy?.location),
    language: Boolean(initialPrivacy?.language),
    email: Boolean(initialPrivacy?.email),
    phone: Boolean(initialPrivacy?.phone),
    profileView: (initialPrivacy?.profileView || "EVERY_ONE") as VisibilityValue,
    postView: (initialPrivacy?.postView || "EVERY_ONE") as VisibilityValue,
    postShare: (initialPrivacy?.postShare || "EVERY_ONE") as VisibilityValue,
    postComments: (initialPrivacy?.postComments || "EVERY_ONE") as VisibilityValue,
    mention: (initialPrivacy?.mention || "EVERY_ONE") as VisibilityValue,
    profileRating: (initialPrivacy?.profileRating || "EVERY_ONE") as VisibilityValue,
    postRating: (initialPrivacy?.postRating || "EVERY_ONE") as VisibilityValue,
    followers: (initialPrivacy?.followers || "EVERY_ONE") as VisibilityValue,
    followings: (initialPrivacy?.followings || "EVERY_ONE") as VisibilityValue,
    messageRequest:
      typeof initialPrivacy?.messageRequest === "boolean" ? initialPrivacy.messageRequest : true,
  };
}

function formatTimeValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const normalized = value.includes("T") ? value.split("T")[1]?.slice(0, 5) : value.slice(0, 5);
  return normalized || "";
}

function toApiTime(value: string) {
  return value ? `${value}:00` : "";
}

function getSocialLinkMap(currentUser: any) {
  const links = currentUser?.morePersonalInfo?.socialLinks || [];
  return links.reduce((acc: Record<string, any>, item: any) => {
    if (item?.type) {
      acc[item.type] = item;
    }
    return acc;
  }, {});
}

function getActivityCollectionKey(mode: ActivityMode): ActivityCollectionKey {
  if (mode === "deleted-post") return "deletedPost";
  if (mode === "deleted-share") return "deletedShare";
  if (mode === "star-post") return "starPost";
  return "starShare";
}

function getActivityTitle(item: any) {
  return item?.about?.title || item?.postData?.about?.title || item?.shareData?.about?.title || item?.title || "Untitled post";
}

function getActivityDescription(item: any) {
  return item?.about?.description || item?.postData?.about?.description || item?.shareData?.about?.description || item?.description || "No description available.";
}

function getActivityPostId(item: any) {
  return item?._id || item?.postId || item?.contentId || item?.postData?._id || item?.shareData?._id || "";
}

function getActivityMeta(item: any) {
  const about = item?.about || item?.postData?.about || item?.shareData?.about || {};
  return [about?.country, about?.state, about?.mainCategory, about?.skill].filter(Boolean).slice(0, 3);
}

function PageShell({
  title,
  description,
  children,
  currentPath,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  currentPath: string;
}) {
  return (
    <section className="flex w-full max-w-7xl gap-6 px-4 py-8 sm:px-6">
      <aside className="hidden w-72 shrink-0 xl:block">
        <div className="sticky top-20 rounded-[28px] border border-dark-300 bg-dark-250 p-4">
          <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-light-500">
            Settings
          </p>
          <div className="flex flex-col gap-1">
            {SETTINGS_LINKS.map((item) => {
              const itemPath = item.href.replace("/settings", "").replace(/^\//, "");
              const isActive = currentPath === itemPath || (itemPath && currentPath.startsWith(itemPath));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl px-4 py-3 text-sm transition ${
                    isActive
                      ? "bg-primary-500 text-light-900"
                      : "text-light-500 hover:bg-dark-200 hover:text-light-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {currentPath.startsWith("privacy") ? (
            <>
              <div className="my-4 border-t border-dark-300" />
              <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-light-500">
                Privacy
              </p>
              <div className="flex flex-col gap-1">
                {PRIVACY_LINKS.map((item) => {
                  const key = item.href.replace("/settings/", "");
                  const isActive = currentPath === key;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-2xl px-4 py-3 text-sm transition ${
                        isActive
                          ? "bg-dark-200 text-light-900"
                          : "text-light-500 hover:bg-dark-200 hover:text-light-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="rounded-[32px] border border-dark-300 bg-dark-250 p-5 sm:p-6">
          <h1 className="text-2xl font-semibold text-light-900 sm:text-3xl">{title}</h1>
          {description ? <p className="pt-2 text-sm text-light-500">{description}</p> : null}
        </div>
        <div className="pt-5">{children}</div>
      </div>
    </section>
  );
}

function CardList({
  items,
}: {
  items: {
    href?: string;
    title: string;
    description?: string;
    external?: boolean;
    forceReload?: boolean;
  }[];
}) {
  return (
    <div className="grid gap-3">
      {items.map((item) =>
        item.href ? (
          item.forceReload ? (
            <button
              key={item.title}
              type="button"
              onClick={() => window.location.assign(item.href!)}
              className="rounded-[26px] border border-dark-300 bg-dark-250 p-5 text-left transition hover:border-primary-500/40 hover:bg-dark-200"
            >
              <p className="text-base font-medium text-light-900">{item.title}</p>
              {item.description ? (
                <p className="pt-1 text-sm text-light-500">{item.description}</p>
              ) : null}
            </button>
          ) : (
            <Link
              key={item.title}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              className="rounded-[26px] border border-dark-300 bg-dark-250 p-5 transition hover:border-primary-500/40 hover:bg-dark-200"
            >
              <p className="text-base font-medium text-light-900">{item.title}</p>
              {item.description ? (
                <p className="pt-1 text-sm text-light-500">{item.description}</p>
              ) : null}
            </Link>
          )
        ) : null
      )}
    </div>
  );
}

function SectionBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-dark-300 bg-dark-250 p-5">
      <p className="text-lg font-medium text-light-900">{title}</p>
      {description ? <p className="pt-1 text-sm text-light-500">{description}</p> : null}
      <div className="pt-4">{children}</div>
    </div>
  );
}

function SwitchRow({
  title,
  description,
  value,
  onToggle,
  disabled,
}: {
  title: string;
  description?: string;
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-dark-300 bg-dark-200 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-light-900">{title}</p>
        {description ? <p className="pt-1 text-xs text-light-500">{description}</p> : null}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className={`relative h-7 w-12 rounded-full transition ${value ? "bg-primary-500" : "bg-dark-300"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-light-900 transition ${
            value ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function ChoiceGroup({
  title,
  description,
  value,
  options,
  onChange,
  disabled,
}: {
  title: string;
  description?: string;
  value: string | boolean;
  options: { value: string | boolean; label: string; description: string }[];
  onChange: (nextValue: any) => void;
  disabled?: boolean;
}) {
  return (
    <SectionBlock title={title} description={description}>
      <div className="grid gap-3">
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <button
              key={`${title}-${String(option.value)}`}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                isActive ? "border-primary-500 bg-primary-500/10" : "border-dark-300 bg-dark-200 hover:border-primary-500/30"
              }`}
            >
              <div>
                <p className="text-sm font-medium text-light-900">{option.label}</p>
                <p className="pt-1 text-xs text-light-500">{option.description}</p>
              </div>
              <span
                className={`h-5 w-5 rounded-full border-2 ${isActive ? "border-primary-500 bg-primary-500" : "border-dark-300"}`}
              />
            </button>
          );
        })}
      </div>
    </SectionBlock>
  );
}

function ActivityTabs({
  activeTab,
  onChange,
}: {
  activeTab: "post" | "shared";
  onChange: (tab: "post" | "shared") => void;
}) {
  return (
    <div className="flex w-fit rounded-full border border-dark-300 bg-dark-250 p-1">
      {ACTIVITY_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`rounded-full px-5 py-2 text-sm transition ${
            activeTab === tab.key ? "bg-primary-500 text-light-900" : "text-light-500 hover:text-light-900"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ActivityGrid({
  items,
  loading,
  mode,
  deletePendingId,
  onRestore,
  onDelete,
}: {
  items: any[];
  loading: boolean;
  mode: "deleted" | "star";
  deletePendingId: string;
  onRestore: (item: any) => void;
  onDelete: (item: any) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-[28px] border border-dark-300 bg-dark-250 p-8 text-center text-sm text-light-500">
        Loading activity...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-[28px] border border-dark-300 bg-dark-250 p-8 text-center text-sm text-light-500">
        No items found in this section.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => {
        const postId = getActivityPostId(item);
        const meta = getActivityMeta(item);

        return (
          <div
            key={`${postId || "activity"}-${getActivityTitle(item)}`}
            className="rounded-[28px] border border-dark-300 bg-dark-250 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-lg font-medium text-light-900">{getActivityTitle(item)}</p>
                <p className="pt-2 text-sm text-light-500">{getActivityDescription(item)}</p>
              </div>
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-primary-500/30 to-dark-200" />
            </div>

            {meta.length ? (
              <div className="flex flex-wrap gap-2 pt-4">
                {meta.map((entry) => (
                  <span
                    key={`${postId}-${entry}`}
                    className="rounded-full border border-dark-300 px-3 py-1 text-xs text-light-500"
                  >
                    {entry}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-5">
              {postId ? (
                <Button
                  type="button"
                  className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
                  onClick={() => window.location.assign(`/post/${postId}`)}
                >
                  Open Post
                </Button>
              ) : null}

              {mode === "deleted" ? (
                <>
                  <Button
                    type="button"
                    className="rounded-full bg-primary-500 text-light-900"
                    onClick={() => onRestore(item)}
                  >
                    Restore
                  </Button>
                  <Button
                    type="button"
                    disabled={deletePendingId === postId}
                    className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
                    onClick={() => onDelete(item)}
                  >
                    Delete Permanently
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SettingsScreen({ slugPath, currentUser, initialPrivacy, initialNotification }: Props) {
  const { setUser } = useUserContext();
  const [notification, setNotification] = useState<NotificationState>(normalizeNotification(initialNotification));
  const [privacy, setPrivacy] = useState(normalizePrivacy(initialPrivacy));
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAccountAction>("");
  const [deleteActivityItem, setDeleteActivityItem] = useState<any>(null);
  const [activityTab, setActivityTab] = useState<"post" | "shared">("post");
  const [activityData, setActivityData] = useState<ActivityCollections>({
    deletedPost: [],
    deletedShare: [],
    starPost: [],
    starShare: [],
  });
  const [activityLoading, setActivityLoading] = useState<ActivityLoading>({
    deletedPost: false,
    deletedShare: false,
    starPost: false,
    starShare: false,
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPrivacy(normalizePrivacy(initialPrivacy));
  }, [initialPrivacy]);

  useEffect(() => {
    setNotification(normalizeNotification(initialNotification));
  }, [initialNotification]);

  useEffect(() => {
    if (slugPath === "activity/deleted" || slugPath === "activity/star-ratings") {
      setActivityTab("post");
    }
  }, [slugPath]);

  const socialLinkMap = useMemo(() => getSocialLinkMap(currentUser), [currentUser]);

  const runSignedOutRedirect = async () => {
    await deleteToken();
    await handleClearStorage();
    setUser(INITIAL_USER);
    window.location.assign("/sign-in");
  };

  const updateNotification = (payload: Partial<NotificationState>) => {
    const previous = { ...notification };
    const next = { ...notification, ...payload };
    setNotification(next);

    startTransition(async () => {
      const res = await updateNotificationSettingsAction(currentUser?._id, {
        ...next,
        quiteModeStartTime: next.quiteModeStartTime ? toApiTime(next.quiteModeStartTime) : "",
        quiteModeEndTime: next.quiteModeEndTime ? toApiTime(next.quiteModeEndTime) : "",
      });

      if (!res || res.status !== "7400") {
        setNotification(previous);
        toast.error(res?.message || "Couldn't update notification setting", { duration: 4000 });
        return;
      }

      toast.success("Notification setting updated", { duration: 2000 });
    });
  };

  const updatePrivacy = (payload: Record<string, any>) => {
    const previous = { ...privacy };
    const next = { ...privacy, ...payload };
    setPrivacy(next);

    startTransition(async () => {
      const res = await updatePrivacySettingsAction(payload);

      if (!res || res.status !== "7400") {
        setPrivacy(previous);
        toast.error(res?.message || "Couldn't update privacy setting", { duration: 4000 });
        return;
      }

      toast.success("Privacy updated", { duration: 2000 });
    });
  };

  const updateSocialPrivacy = (type: string, show: boolean) => {
    const socialLink = socialLinkMap[type];

    if (!socialLink?.type || !socialLink?.url) {
      toast.error(`No ${type} link is connected on this account`, { duration: 3000 });
      return;
    }

    startTransition(async () => {
      const res = await updateSocialLinksPrivacyAction([
        { type: socialLink.type, url: socialLink.url, show },
      ]);

      if (!res || res.status !== "7400") {
        toast.error(res?.message || `Couldn't update ${type} visibility`, { duration: 4000 });
        return;
      }

      toast.success(`${type} visibility updated`, { duration: 2000 });
    });
  };

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all password fields", { duration: 3000 });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password must match", { duration: 3000 });
      return;
    }

    startTransition(async () => {
      const res = await changePasswordSettingsAction({ oldPassword, newPassword });

      if (!res || res.status !== "7400") {
        toast.error(res?.message || "Couldn't change password", { duration: 4000 });
        return;
      }

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully", { duration: 2500 });
    });
  };

  const handleAccountAction = () => {
    if (!confirmAction) {
      return;
    }

    startTransition(async () => {
      const res =
        confirmAction === "delete"
          ? await deleteAccountSettingsAction()
          : await deactivateAccountSettingsAction();

      if (!res || res.status !== "7400") {
        toast.error(res?.message || `Couldn't ${confirmAction} account`, { duration: 4000 });
        return;
      }

      toast.success(
        confirmAction === "delete"
          ? "Your account has been deleted permanently"
          : "Your account has been deactivated successfully",
        { duration: 3000 }
      );

      setConfirmAction("");
      await runSignedOutRedirect();
    });
  };

  const loadActivity = (mode: ActivityMode) => {
    const collectionKey = getActivityCollectionKey(mode);
    setActivityLoading((prev) => ({ ...prev, [collectionKey]: true }));

    startTransition(async () => {
      const items = await getSettingsActivityFeedAction(mode);
      setActivityData((prev) => ({ ...prev, [collectionKey]: items || [] }));
      setActivityLoading((prev) => ({ ...prev, [collectionKey]: false }));
    });
  };

  useEffect(() => {
    if (slugPath === "activity/deleted") {
      if (!activityData.deletedPost.length) {
        loadActivity("deleted-post");
      }
      if (!activityData.deletedShare.length) {
        loadActivity("deleted-share");
      }
    }
  }, [activityData.deletedPost.length, activityData.deletedShare.length, slugPath]);

  useEffect(() => {
    if (slugPath === "activity/star-ratings") {
      if (!activityData.starPost.length) {
        loadActivity("star-post");
      }
      if (!activityData.starShare.length) {
        loadActivity("star-share");
      }
    }
  }, [activityData.starPost.length, activityData.starShare.length, slugPath]);

  const handleRestore = (item: any) => {
    const postId = getActivityPostId(item);

    if (!postId) {
      toast.error("This post can't be restored right now", { duration: 3000 });
      return;
    }

    startTransition(async () => {
      const res = await restoreDeletedPostSettingsAction(postId);

      if (!res || res.status !== "7400") {
        toast.error(res?.message || "Couldn't restore this post", { duration: 4000 });
        return;
      }

      toast.success("Post restored successfully", { duration: 2500 });
      loadActivity("deleted-post");
      loadActivity("deleted-share");
    });
  };

  const handleDeleteActivity = () => {
    const postId = getActivityPostId(deleteActivityItem);

    if (!postId) {
      setDeleteActivityItem(null);
      return;
    }

    startTransition(async () => {
      const res = await permanentlyDeletePostSettingsAction(postId);

      if (!res || res.status !== "7400") {
        toast.error(res?.message || "Couldn't delete this post permanently", {
          duration: 4000,
        });
        return;
      }

      toast.success("Post deleted permanently", { duration: 2500 });
      setDeleteActivityItem(null);
      loadActivity("deleted-post");
      loadActivity("deleted-share");
    });
  };

  const rootContent = (
    <PageShell
      title="Account Settings"
      description="Manage your account, privacy, notifications, and activity in one place."
      currentPath={slugPath}
    >
      <div className="grid gap-4">
        <CardList
          items={[
            {
              href: "/settings/account-centre",
              title: "Account Centre",
              description: "Change password, deactivate account, or delete account.",
            },
            {
              href: "/settings/notifications",
              title: "Notifications",
              description: "Control push notifications and quiet mode.",
            },
            ...(currentUser?.isTalent
              ? [
                  {
                    href: "/settings/privacy",
                    title: "Profile Privacy",
                    description:
                      "Choose who can view your profile, ratings, posts, messages, and social links.",
                  },
                ]
              : []),
            {
              href: "/settings/activity",
              title: "Your Activity",
              description: "Review deleted content and star-rated posts.",
              forceReload: true,
            },
          ]}
        />

        <SectionBlock title="More Info and Support">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
              <p className="text-sm font-medium text-light-900">Help</p>
              <p className="pt-1 text-xs text-light-500">
                Need support with your account or settings? Use the in-app flows above
                first, then reach out to your team support channel if needed.
              </p>
            </div>
            <div className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
              <p className="text-sm font-medium text-light-900">About</p>
              <p className="pt-1 text-xs text-light-500">
                Talents Explore settings on web follow the same account, privacy,
                notification, and activity rules as the mobile app.
              </p>
            </div>
          </div>
        </SectionBlock>

        <SectionBlock title="Session">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
              onClick={runSignedOutRedirect}
            >
              Logout
            </Button>
          </div>
        </SectionBlock>
      </div>
    </PageShell>
  );

  const privacyHomeContent = (
    <PageShell
      title="Profile Privacy"
      description="Choose how your profile, ratings, followers, comments, and messages are shared."
      currentPath={slugPath}
    >
      <CardList
        items={PRIVACY_LINKS.map((item) => ({
          href: item.href,
          title: item.label,
          description: `Manage ${item.label.toLowerCase()} visibility and preferences.`,
        }))}
      />
    </PageShell>
  );

  const notificationsContent = (
    <PageShell
      title="Notification Settings"
      description="Manage push notifications and quiet mode timing."
      currentPath={slugPath}
    >
      <div className="grid gap-4">
        <SectionBlock title="Push Notifications">
          <SwitchRow
            title="Push notifications"
            description="Automatically pause or resume all notifications."
            value={notification.pushNotofication}
            disabled={isPending}
            onToggle={() =>
              updateNotification({ pushNotofication: !notification.pushNotofication })
            }
          />
        </SectionBlock>

        <SectionBlock title="Quiet Mode">
          <div className="grid gap-4">
            <SwitchRow
              title="Quiet mode"
              description="Automatically pause notifications at night."
              value={notification.quiteMode}
              disabled={isPending}
              onToggle={() => updateNotification({ quiteMode: !notification.quiteMode })}
            />

            {notification.quiteMode ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="rounded-2xl border border-dark-300 bg-dark-200 px-4 py-3">
                  <span className="block pb-2 text-sm text-light-500">Start time</span>
                  <input
                    type="time"
                    value={formatTimeValue(notification.quiteModeStartTime)}
                    onChange={(event) =>
                      setNotification((prev) => ({
                        ...prev,
                        quiteModeStartTime: event.target.value,
                      }))
                    }
                    className="w-full bg-transparent text-light-900 outline-none"
                  />
                </label>
                <label className="rounded-2xl border border-dark-300 bg-dark-200 px-4 py-3">
                  <span className="block pb-2 text-sm text-light-500">End time</span>
                  <input
                    type="time"
                    value={formatTimeValue(notification.quiteModeEndTime)}
                    onChange={(event) =>
                      setNotification((prev) => ({
                        ...prev,
                        quiteModeEndTime: event.target.value,
                      }))
                    }
                    className="w-full bg-transparent text-light-900 outline-none"
                  />
                </label>
                <Button
                  type="button"
                  disabled={isPending}
                  className="w-fit rounded-full bg-primary-500 text-light-900"
                  onClick={() =>
                    updateNotification({
                      quiteModeStartTime: formatTimeValue(notification.quiteModeStartTime),
                      quiteModeEndTime: formatTimeValue(notification.quiteModeEndTime),
                    })
                  }
                >
                  Save Quiet Mode
                </Button>
              </div>
            ) : null}
          </div>
        </SectionBlock>
      </div>
    </PageShell>
  );

  const accountCentreContent = (
    <PageShell
      title="Account Centre"
      description="Manage password and account status."
      currentPath={slugPath}
    >
      <CardList
        items={[
          {
            href: "/settings/account-centre/change-password",
            title: "Change Password",
            description: "Update your current password securely.",
          },
        ]}
      />
      <div className="mt-4 grid gap-4">
        <SectionBlock title="Account Actions">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
              onClick={() => setConfirmAction("deactivate")}
            >
              Deactivate Account
            </Button>
            <Button
              type="button"
              className="rounded-full bg-primary-500 text-light-900"
              onClick={() => setConfirmAction("delete")}
            >
              Delete Account
            </Button>
          </div>
        </SectionBlock>
      </div>
    </PageShell>
  );

  const changePasswordContent = (
    <PageShell
      title="Change Password"
      description="Use your current password to set a new one."
      currentPath={slugPath}
    >
      <SectionBlock title="Password">
        <div className="grid gap-3">
          {[
            { label: "Current password", value: oldPassword, onChange: setOldPassword },
            { label: "New password", value: newPassword, onChange: setNewPassword },
            {
              label: "Confirm new password",
              value: confirmPassword,
              onChange: setConfirmPassword,
            },
          ].map((field) => (
            <label
              key={field.label}
              className="rounded-2xl border border-dark-300 bg-dark-200 px-4 py-3"
            >
              <span className="block pb-2 text-sm text-light-500">{field.label}</span>
              <input
                type="password"
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                className="w-full bg-transparent text-light-900 outline-none"
              />
            </label>
          ))}
          <Button
            type="button"
            disabled={isPending}
            className="w-fit rounded-full bg-primary-500 text-light-900"
            onClick={handleChangePassword}
          >
            Update Password
          </Button>
        </div>
      </SectionBlock>
    </PageShell>
  );

  const privacyProfileContent = (
    <PageShell
      title="Profile Privacy"
      description="Show or hide profile details, social links, and visibility rules."
      currentPath={slugPath}
    >
      <div className="grid gap-4">
        <SectionBlock title="Basic Info" description="Choose what profile basics are visible.">
          <div className="grid gap-3">
            <SwitchRow
              title="First name"
              value={privacy.firstName}
              disabled={isPending}
              onToggle={() => updatePrivacy({ firstName: !privacy.firstName })}
            />
            <SwitchRow
              title="Last name"
              value={privacy.lastName}
              disabled={isPending}
              onToggle={() => updatePrivacy({ lastName: !privacy.lastName })}
            />
            <SwitchRow
              title="Gender"
              value={privacy.gender}
              disabled={isPending}
              onToggle={() => updatePrivacy({ gender: !privacy.gender })}
            />
            <SwitchRow
              title="Date of birth"
              value={privacy.dob}
              disabled={isPending}
              onToggle={() => updatePrivacy({ dob: !privacy.dob })}
            />
            <SwitchRow
              title="Location"
              value={privacy.location}
              disabled={isPending}
              onToggle={() => updatePrivacy({ location: !privacy.location })}
            />
            <SwitchRow
              title="Language"
              value={privacy.language}
              disabled={isPending}
              onToggle={() => updatePrivacy({ language: !privacy.language })}
            />
          </div>
        </SectionBlock>

        <SectionBlock
          title="Contact Info"
          description="Choose whether viewers can see your direct contact details."
        >
          <div className="grid gap-3">
            <SwitchRow
              title="Email"
              value={privacy.email}
              disabled={isPending}
              onToggle={() => updatePrivacy({ email: !privacy.email })}
            />
            <SwitchRow
              title="Phone number"
              value={privacy.phone}
              disabled={isPending}
              onToggle={() => updatePrivacy({ phone: !privacy.phone })}
            />
          </div>
        </SectionBlock>

        <SectionBlock
          title="Social Media Links"
          description="Show or hide the connected social links in your profile."
        >
          <div className="grid gap-3">
            <SwitchRow
              title="Facebook"
              value={socialLinkMap.facebook?.show === true}
              disabled={isPending}
              onToggle={() => updateSocialPrivacy("facebook", socialLinkMap.facebook?.show !== true)}
            />
            <SwitchRow
              title="Instagram"
              value={socialLinkMap.instagram?.show === true}
              disabled={isPending}
              onToggle={() =>
                updateSocialPrivacy("instagram", socialLinkMap.instagram?.show !== true)
              }
            />
            <SwitchRow
              title="LinkedIn"
              value={socialLinkMap.linkedin?.show === true}
              disabled={isPending}
              onToggle={() => updateSocialPrivacy("linkedin", socialLinkMap.linkedin?.show !== true)}
            />
          </div>
        </SectionBlock>

        <ChoiceGroup
          title="Profile View"
          description="Control who can view your profile."
          value={privacy.profileView}
          options={VISIBILITY_OPTIONS}
          disabled={isPending}
          onChange={(value) => updatePrivacy({ profileView: value })}
        />

        <ChoiceGroup
          title="Post View"
          description="Control who can view your posts."
          value={privacy.postView}
          options={VISIBILITY_OPTIONS}
          disabled={isPending}
          onChange={(value) => updatePrivacy({ postView: value })}
        />

        <ChoiceGroup
          title="Share Link View"
          description="Control who can view your shared links."
          value={privacy.postShare}
          options={VISIBILITY_OPTIONS}
          disabled={isPending}
          onChange={(value) => updatePrivacy({ postShare: value })}
        />
      </div>
    </PageShell>
  );

  const privacyCommentsContent = (
    <PageShell
      title="Comments and Tags"
      description="Choose who can comment on posts and mention you."
      currentPath={slugPath}
    >
      <div className="grid gap-4">
        <ChoiceGroup
          title="Comments"
          description="Choose who can leave comments on your content."
          value={privacy.postComments}
          options={VISIBILITY_OPTIONS}
          disabled={isPending}
          onChange={(value) => updatePrivacy({ postComments: value })}
        />

        <ChoiceGroup
          title="Tag / Mention"
          description="Choose who can tag or mention you."
          value={privacy.mention}
          options={VISIBILITY_OPTIONS}
          disabled={isPending}
          onChange={(value) => updatePrivacy({ mention: value })}
        />
      </div>
    </PageShell>
  );

  const privacyRatingsContent = (
    <PageShell
      title="Star Ratings"
      description="Choose who can see and give ratings."
      currentPath={slugPath}
    >
      <div className="grid gap-4">
        <ChoiceGroup
          title="Post Rating"
          description="Choose who can rate your posts."
          value={privacy.postRating}
          options={VISIBILITY_OPTIONS}
          disabled={isPending}
          onChange={(value) => updatePrivacy({ postRating: value })}
        />

        <ChoiceGroup
          title="Profile Rating"
          description="Choose who can rate your profile."
          value={privacy.profileRating}
          options={VISIBILITY_OPTIONS}
          disabled={isPending}
          onChange={(value) => updatePrivacy({ profileRating: value })}
        />
      </div>
    </PageShell>
  );

  const privacyFollowersContent = (
    <PageShell
      title="Following and Followers"
      description="Choose who can see your network."
      currentPath={slugPath}
    >
      <div className="grid gap-4">
        <ChoiceGroup
          title="Followers"
          description="Choose who can see the people following you."
          value={privacy.followers}
          options={VISIBILITY_OPTIONS}
          disabled={isPending}
          onChange={(value) => updatePrivacy({ followers: value })}
        />

        <ChoiceGroup
          title="Following"
          description="Choose who can see the people you follow."
          value={privacy.followings}
          options={VISIBILITY_OPTIONS}
          disabled={isPending}
          onChange={(value) => updatePrivacy({ followings: value })}
        />
      </div>
    </PageShell>
  );

  const privacyMessagesContent = (
    <PageShell
      title="Messages"
      description="Control whether new message requests can reach you."
      currentPath={slugPath}
    >
      <ChoiceGroup
        title="New Message Requests"
        description="Turn incoming message requests on or off."
        value={privacy.messageRequest}
        options={MESSAGE_REQUEST_OPTIONS}
        disabled={isPending}
        onChange={(value) => updatePrivacy({ messageRequest: value })}
      />
    </PageShell>
  );

  const activityHomeContent = (
    <PageShell
      title="Your Activity"
      description="Review deleted content and star-rating history."
      currentPath={slugPath}
    >
      <CardList
        items={[
          {
            href: "/settings/activity/deleted",
            title: "Deleted Post",
            description: "Open your recently deleted posts and shared items.",
            forceReload: true,
          },
          {
            href: "/settings/activity/star-ratings",
            title: "Star Ratings",
            description: "Review posts and shared items from your ratings activity.",
            forceReload: true,
          },
        ]}
      />
    </PageShell>
  );

  const deletedItems = activityTab === "post" ? activityData.deletedPost : activityData.deletedShare;
  const deletedLoading = activityTab === "post" ? activityLoading.deletedPost : activityLoading.deletedShare;
  const starItems = activityTab === "post" ? activityData.starPost : activityData.starShare;
  const starLoading = activityTab === "post" ? activityLoading.starPost : activityLoading.starShare;

  const activityDeletedContent = (
    <PageShell
      title="Recently Deleted"
      description="Restore deleted content or remove it permanently."
      currentPath={slugPath}
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ActivityTabs activeTab={activityTab} onChange={setActivityTab} />
          <Button
            type="button"
            className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
            onClick={() => {
              loadActivity("deleted-post");
              loadActivity("deleted-share");
            }}
          >
            Refresh
          </Button>
        </div>
        <ActivityGrid
          items={deletedItems}
          loading={deletedLoading}
          mode="deleted"
          deletePendingId={getActivityPostId(deleteActivityItem)}
          onRestore={handleRestore}
          onDelete={setDeleteActivityItem}
        />
      </div>
    </PageShell>
  );

  const activityStarContent = (
    <PageShell
      title="Star Ratings"
      description="Review your rated posts and shared links."
      currentPath={slugPath}
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ActivityTabs activeTab={activityTab} onChange={setActivityTab} />
          <Button
            type="button"
            className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
            onClick={() => {
              loadActivity("star-post");
              loadActivity("star-share");
            }}
          >
            Refresh
          </Button>
        </div>
        <ActivityGrid
          items={starItems}
          loading={starLoading}
          mode="star"
          deletePendingId=""
          onRestore={() => {}}
          onDelete={() => {}}
        />
      </div>
    </PageShell>
  );

  const fallbackContent = (
    <PageShell
      title="Settings"
      description="This settings section is being wired into the web app."
      currentPath={slugPath}
    >
      <CardList items={[{ href: "/settings", title: "Back to Settings Home" }]} />
    </PageShell>
  );

  let content = fallbackContent;

  if (slugPath === "") {
    content = rootContent;
  } else if (slugPath === "privacy") {
    content = privacyHomeContent;
  } else if (slugPath === "notifications") {
    content = notificationsContent;
  } else if (slugPath === "account-centre") {
    content = accountCentreContent;
  } else if (slugPath === "account-centre/change-password") {
    content = changePasswordContent;
  } else if (slugPath === "privacy/profile") {
    content = privacyProfileContent;
  } else if (slugPath === "privacy/comments-tags") {
    content = privacyCommentsContent;
  } else if (slugPath === "privacy/star-ratings") {
    content = privacyRatingsContent;
  } else if (slugPath === "privacy/following-followers") {
    content = privacyFollowersContent;
  } else if (slugPath === "privacy/messages") {
    content = privacyMessagesContent;
  } else if (slugPath === "activity") {
    content = activityHomeContent;
  } else if (slugPath === "activity/deleted") {
    content = activityDeletedContent;
  } else if (slugPath === "activity/star-ratings") {
    content = activityStarContent;
  }

  return (
    <>
      {content}

      <AlertDialog
        open={confirmAction !== ""}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction("");
          }
        }}
      >
        <AlertDialogContent className="border-dark-300 bg-dark-200 text-light-900">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "delete" ? "Delete Account?" : "Deactivate Account?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-light-500">
              {confirmAction === "delete"
                ? "This will permanently remove your account."
                : "This will deactivate your account until you sign in again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-dark-300 bg-dark-250 text-light-900 hover:bg-dark-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary-500 text-light-900"
              onClick={handleAccountAction}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteActivityItem)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteActivityItem(null);
          }
        }}
      >
        <AlertDialogContent className="border-dark-300 bg-dark-200 text-light-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post permanently?</AlertDialogTitle>
            <AlertDialogDescription className="text-light-500">
              This action can&apos;t be undone. The deleted item will be removed from
              your account for good.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-dark-300 bg-dark-250 text-light-900 hover:bg-dark-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary-500 text-light-900"
              onClick={handleDeleteActivity}
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default SettingsScreen;
