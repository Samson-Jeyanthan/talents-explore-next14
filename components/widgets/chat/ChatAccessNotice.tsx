"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function ChatAccessNotice({
  denied = false,
}: {
  denied?: boolean;
}) {
  return (
    <section
      role="alert"
      className="m-4 grid max-w-xl gap-4 rounded-2xl border border-dark-300 bg-dark-250 p-6 text-light-900"
    >
      <h1 className="text-xl font-semibold">
        {denied ? "Group chat unavailable" : "Unable to verify group access"}
      </h1>
      <p className="text-sm text-light-700">
        {denied
          ? "Your account is not a member of this group. Accept your collaboration invitation or contact the collaboration owner if you need access."
          : "Group membership could not be loaded. Please try again."}
      </p>
      {!denied ? (
        <Button type="button" onClick={() => window.location.reload()}>
          Try again
        </Button>
      ) : null}
      <Link href="/chat" className="text-sm text-primary-500 underline">
        Back to chats
      </Link>
    </section>
  );
}
