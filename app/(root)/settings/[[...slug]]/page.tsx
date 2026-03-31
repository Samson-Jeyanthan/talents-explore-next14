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
  const currentUser = await getCurrentSettingsUserAction();

  if (!currentUser?._id) {
    redirect("/sign-in");
  }

  const shouldLoadPrivacy = slugPath === "" || slugPath.startsWith("privacy");
  const shouldLoadNotification = slugPath === "" || slugPath === "notifications";

  const [initialPrivacy, initialNotification] = await Promise.all([
    shouldLoadPrivacy ? getPrivacySettingsAction() : Promise.resolve(null),
    shouldLoadNotification
      ? getNotificationSettingsAction()
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
