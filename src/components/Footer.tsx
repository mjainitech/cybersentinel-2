import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { footerLinks } from "@/services/placeholderData";

/**
 * Footer for public pages. Link groups are sourced from
 * services/placeholderData so copy can be updated in one place.
 */
export function Footer() {
  return (
    <footer className="border-t border-base-border/60 bg-base-surface/40">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
              An AI-powered cybersecurity assistant that helps students and everyday
              users spot threats before they become a problem.
            </p>
          </div>

          <FooterColumn title="Product" links={footerLinks.product} />
          <FooterColumn title="Company" links={footerLinks.company} />
          <FooterColumn title="Legal" links={footerLinks.legal} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-base-border/60 pt-6 sm:flex-row">
          <p className="text-xs text-ink-faint">
            &copy; {new Date().getFullYear()} CyberSentinel. All rights reserved.
          </p>
          <p className="text-xs text-ink-faint">Built for students who want to stay safe online.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-ink">{title}</h4>
      <ul className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.to} className="text-sm text-ink-muted transition-colors hover:text-ink">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
