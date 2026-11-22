export const PUBLIC_POLICY_LINKS = [
  {
    title: "Terms and Conditions",
    href: "/terms-and-conditions",
    description: "The agreement for using Talents Explore.",
  },
  {
    title: "Privacy Policy",
    href: "/privacy-policy",
    description: "How your information is collected, used and protected.",
  },
  {
    title: "Community Standards",
    href: "/community-guidelines",
    description: "Guidelines for a safe and respectful community.",
  },
  {
    title: "Intellectual Property Policy",
    href: "/intellectual-property-policy",
    description: "Copyright, trademarks and respect for original work.",
  },
  {
    title: "Cookies Policy",
    href: "/cookies-policy",
    description: "Tracking technologies and the choices available to you.",
  },
  {
    title: "Branded Content Policy",
    href: "/branded-content-policy",
    description: "Rules for sponsored content and commercial relationships.",
  },
  {
    title: "Child Safety Standards",
    href: "/child-safety-standards",
    description: "Age requirements, child protection and reporting concerns.",
  },
] as const;

export const PUBLIC_SITE_LINKS = [
  ...PUBLIC_POLICY_LINKS,
  {
    title: "Delete Account",
    href: "/delete-account",
    description: "Verify your account and confirm permanent account deletion.",
  },
] as const;
