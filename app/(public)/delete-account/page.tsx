import DeleteAccountFlow from "@/components/legal/DeleteAccountFlow";

export const metadata = {
  title: "Delete Account | Talents Explore",
  description:
    "Verify your Talents Explore account and confirm permanent account deletion.",
  alternates: { canonical: "/delete-account" },
};

export default function DeleteAccountPage() {
  return <DeleteAccountFlow />;
}
