import Link from "next/link";

const FOOTER_LINKS = [
  {
    name: "Terms & Conditions",
    path: "https://talentsexplore.com/terms-and-conditions",
  },
  {
    name: "Privacy Policy",
    path: "https://talentsexplore.com/privacy-policy",
  },
  {
    name: "Branded Policy",
    path: "https://talentsexplore.com/branded-policy",
  },
  {
    name: "Cookies",
    path: "https://talentsexplore.com/cookies-policy",
  },
  {
    name: "Community",
    path: "https://talentsexplore.com/community-guidelines",
  },
  {
    name: "Intellectual Property",
    path: "https://talentsexplore.com/intellectual-property-policy",
  },
];

const Footer = () => {
  return (
    <footer className="flex-center mb-3 mt-5 flex-col gap-2 text-xs text-light-500">
      <div className="flex gap-3.5">
        {FOOTER_LINKS.map((link, index) => (
          <Link
            href={link.path}
            key={index}
            target="_blank"
            className="hover:text-light-900"
          >
            {link.name}
          </Link>
        ))}
      </div>
      <p>Talents Explore © {new Date().getFullYear()}</p>
    </footer>
  );
};

export default Footer;
