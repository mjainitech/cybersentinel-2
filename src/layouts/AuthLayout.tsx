import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Minimal shell for Login/Register: just the wordmark and a centered
 * stage. Skips the full Navbar/Footer so the auth card stays the
 * only focus on screen.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link to="/" className="absolute left-6 top-6 sm:left-8 sm:top-8">
        <Logo />
      </Link>
      {children}
    </div>
  );
}
