import { getSession, checkIsAbout } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const isAbout = await checkIsAbout();

  if (!isAbout) {
    redirect("/complete-profile");
  }

  redirect("/home");
}
