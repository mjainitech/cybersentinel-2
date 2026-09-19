import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { DashboardTopbar } from "@/components/DashboardTopbar";
import { useDisclosure } from "@/hooks/useDisclosure";

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Shell for every authenticated /dashboard/* route: static sidebar on
 * desktop, slide-in drawer on mobile (state owned here and passed down),
 * plus the top bar. Page-specific content is passed as children.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isOpen, open, close } = useDisclosure();

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar isOpen={isOpen} onClose={close} />

      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <DashboardTopbar onMenuClick={open} />
        <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
