import { redirect } from "next/navigation";
import SettingsScreen from "@/components/widgets/settings/SettingsScreen";
import { getSession } from "@/lib/session";
import {
  getCurrentSettingsUserAction,
  getNotificationSettingsAction,
  getPrivacySettingsAction,
} from "@/actions/settings.action";

export const dynamic = "force-dynamic";

type Props = {
  params: {
    slug?: string[];
  };
};

export default async function SettingsPage({ params }: Props) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const slugPath = params?.slug?.join("/") || "";
  const isRequestRoute = slugPath === "advertisement" || slugPath.startsWith("advertisement/") || slugPath === "paid-promotions" || slugPath.startsWith("paid-promotions/");
  const currentUser = isRequestRoute ? null : await getCurrentSettingsUserAction();

  if (!isRequestRoute && !currentUser?._id) {
    redirect("/sign-in");
  }

  const shouldLoadPrivacy = slugPath === "" || slugPath.startsWith("privacy");
  const shouldLoadNotification = slugPath === "" || slugPath === "notifications";

  const [initialPrivacy, initialNotification] = await Promise.all([
    shouldLoadPrivacy ? getPrivacySettingsAction(session) : Promise.resolve(null),
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
