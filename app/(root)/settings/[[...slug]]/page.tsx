import SettingsScreen from "@/components/widgets/settings/SettingsScreen";
// import { getSession } from "@/lib/session";
import {
  getCurrentSettingsUserAction,
  getNotificationSettingsAction,
  getPrivacySettingsAction,
} from "@/actions/settings.action";
import { getAuthHeaders } from "@/lib/session";
import TalentAccessNotice from "@/components/others/TalentAccessNotice";

export const dynamic = "force-dynamic";

type Props = {
  params: {
    slug?: string[];
  };
};

export default async function SettingsPage({ params }: Props) {
  // A page render cannot write rotated cookies. Resolve freshness through the
  // refresh route before passing an access token to any settings API request.
  const authHeaders = await getAuthHeaders();
  const session = authHeaders.Authorization.slice("Bearer ".length);

  const slugPath = params?.slug?.join("/") || "";
  const isRequestRoute =
    slugPath === "advertisement" ||
    slugPath.startsWith("advertisement/") ||
    slugPath === "paid-promotions" ||
    slugPath.startsWith("paid-promotions/");
  const currentUser = isRequestRoute
    ? null
    : await getCurrentSettingsUserAction();

  if (!isRequestRoute && !currentUser?._id) {
    throw new Error("Unable to load your settings. Please try again.");
  }
  if (slugPath.startsWith("privacy") && currentUser?.isTalent !== true)
    return <TalentAccessNotice />;

  const shouldLoadPrivacy = slugPath === "" || slugPath.startsWith("privacy");
  const shouldLoadNotification =
    slugPath === "" || slugPath === "notifications";

  const [initialPrivacy, initialNotification] = await Promise.all([
    shouldLoadPrivacy && currentUser?.isTalent === true
      ? getPrivacySettingsAction(session)
      : Promise.resolve(null),
    shouldLoadNotification
      ? getNotificationSettingsAction(currentUser?._id, session)
      : Promise.resolve(null),
  ]);

  return (
    <SettingsScreen
      slugPath={slugPath}
      currentUser={currentUser}
      initialPrivacy={initialPrivacy}
      initialNotification={initialNotification}
    />
  );
}
