import { FOOTER_LINKS } from "@/constants";
import Link from "next/link";

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
