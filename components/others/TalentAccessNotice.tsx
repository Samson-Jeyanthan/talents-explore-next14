import Link from "next/link";

export default function TalentAccessNotice() {
  return (
    <section className="mx-auto w-full max-w-xl p-6 text-light-900">
      <h1 className="text-xl font-semibold">
        Become a talent to use this feature
      </h1>
      <p className="mt-3 text-sm text-light-600">
        Talent accounts can create posts, collaborate, join collaboration group
        chats, and manage professional profile details and visibility. You can
        still share links, explore content, and use direct messages with your
        normal account.
      </p>
      <div className="mt-5 flex flex-wrap gap-4">
        <Link
          href="/talent-registration"
          className="rounded-md bg-primary-500 px-4 py-3 text-sm text-white"
        >
          Become a Talent
        </Link>
        <Link href="/home" className="px-4 py-3 text-sm underline">
          Back to Home
        </Link>
      </div>
    </section>
  );
}
