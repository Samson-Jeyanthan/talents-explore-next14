import { checkIsAbout } from "@/actions/session.action";
import { getSession } from "@/lib/session";
// import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import PublicSiteShell from "@/components/legal/PublicSiteShell";
import PolicyCentre from "@/components/legal/PolicyCentre";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    return (
      <PublicSiteShell>
        <PolicyCentre />
      </PublicSiteShell>
    );
  }

  const isAbout = await checkIsAbout();

  if (!isAbout) {
    redirect("/complete-profile");
  }

  redirect("/home");
}
