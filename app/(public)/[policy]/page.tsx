import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  POLICY_DOCUMENTS,
  UNPUBLISHED_POLICIES,
  publicPolicyTitle,
  getPolicyDocument,
} from "@/lib/legal";

type Props = { params: { policy: string } };
export function generateStaticParams() {
  return Object.keys({ ...POLICY_DOCUMENTS, ...UNPUBLISHED_POLICIES }).map(
    (policy) => ({ policy }),
  );
}
export function generateMetadata({ params }: Props) {
  return {
    title: `${publicPolicyTitle(params.policy) || "Policy"} | Talents Explore`,
    alternates: { canonical: `/${params.policy}` },
  };
}
export default function PolicyPage({ params }: Props) {
  if (params.policy === "login" || params.policy === "account-deletion")
    redirect("/delete-account");
  if (params.policy === "community-standards")
    redirect("/community-guidelines");
  if (params.policy === "branded-policy") redirect("/branded-content-policy");
  const document = getPolicyDocument(params.policy);
  if (!document) {
    const title = Object.hasOwn(UNPUBLISHED_POLICIES, params.policy)
      ? UNPUBLISHED_POLICIES[params.policy]
      : undefined;
    if (!title) notFound();
    return (
      <article className="max-w-3xl">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-5 leading-7 text-light-700">
          For information about this policy, please contact{" "}
          <a
            href="mailto:info@talentsexplore.com"
            className="text-light-900 underline"
          >
            info@talentsexplore.com
          </a>
          .
        </p>
        <Link
          href="/terms-and-conditions"
          className="mt-6 inline-block underline"
        >
          Read our Terms and Conditions
        </Link>
      </article>
    );
  }
  return (
    <article className="policy-document">
      <Link
        href="/policies"
        className="mb-5 inline-block text-sm text-light-600 hover:text-light-900"
      >
        &larr; Policy Centre
      </Link>
      <h1 className="text-3xl font-semibold sm:text-4xl">{document.title}</h1>
      <div
        className="mt-6 leading-7"
        dangerouslySetInnerHTML={{ __html: document.introduction }}
      />
      {document.sections.length > 0 && (
        <nav
          aria-label="On this page"
          className="my-8 rounded-2xl border border-dark-400 bg-dark-250 p-5"
        >
          <h2 className="mb-3 font-semibold">On this page</h2>
          <ol className="grid gap-2 text-sm sm:grid-cols-2">
            {document.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-light-700 hover:text-light-900 hover:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      {document.sections.map((section) => (
        <section
          id={section.id}
          key={section.id}
          className="scroll-mt-5 border-t border-dark-400 py-7"
        >
          <h2 className="mb-5 text-xl font-semibold">{section.title}</h2>
          <div
            className="leading-7"
            dangerouslySetInnerHTML={{ __html: section.html }}
          />
        </section>
      ))}
    </article>
  );
}
