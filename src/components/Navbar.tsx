import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import { cn } from "@/utils/cn";

const navLinks = [
  { label: "Features", to: "/#features" },
  { label: "Learning Hub", to: "/#" },
  { label: "About", to: "/#" },
];

/**
 * Top navigation for public-facing pages (landing, login, register).
 * The authenticated dashboard uses its own top bar inside DashboardLayout.
 */
export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-base-border/60 bg-base/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" aria-label="CyberSentinel home">
          <Logo />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.to}
              className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <NavLink to="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </NavLink>
          <NavLink to="/register">
            <Button variant="primary" size="sm">
              Get Started
            </Button>
          </NavLink>
        </div>

        {/* Mobile toggle */}
        <button
          className="text-ink md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "grid overflow-hidden border-t border-base-border/60 bg-base/95 transition-all duration-300 md:hidden",
          mobileOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="flex flex-col gap-4 overflow-hidden px-6 py-5">
          {navLinks.map((link) => (
            <a key={link.label} href={link.to} className="text-sm font-medium text-ink-muted">
              {link.label}
            </a>
          ))}
          <div className="mt-2 flex flex-col gap-2">
            <NavLink to="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full">
                Log in
              </Button>
            </NavLink>
            <NavLink to="/register" onClick={() => setMobileOpen(false)}>
              <Button variant="primary" className="w-full">
                Get Started
              </Button>
            </NavLink>
          </div>
        </div>
      </div>
    </header>
  );
}
