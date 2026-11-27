import { getCurrentAccountAccessAction } from "@/actions/account-access.action";
import TalentAccessNotice from "@/components/others/TalentAccessNotice";
import type { ReactNode } from "react";

export default async function CollaborationLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentAccountAccessAction();
  return user.isTalent ? children : <TalentAccessNotice />;
}
