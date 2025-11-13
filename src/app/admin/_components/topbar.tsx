"use client";

import { Menu, Search, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_LINKS } from "../_constants/nav-links";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

const MobileSidebar = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Toggle navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>
      {open ? (
        <div className="absolute left-0 right-0 top-16 z-40 border-b border-slate-200 bg-white/95 shadow-lg">
          <nav className="flex flex-col gap-1 px-4 py-4">
            {ADMIN_NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                  onClick={() => setOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </div>
  );
};

const Topbar = () => {
  const pathname = usePathname();
  const activeTitle =
    ADMIN_NAV_LINKS.find((link) => pathname?.startsWith(link.href))?.label ??
    "Overview";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur">
      <MobileSidebar />
      <div className="flex flex-1 items-center gap-3">
        <h1 className="text-lg font-semibold text-slate-900">{activeTitle}</h1>
        <div className="relative hidden w-full max-w-sm items-center lg:flex">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            placeholder="Search admin..."
            type="search"
            aria-label="Search"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="hidden rounded-full lg:inline-flex">
          Quick actions
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border border-slate-200"
          aria-label="Open profile"
        >
          <UserCircle className="h-6 w-6 text-slate-600" />
        </Button>
      </div>
    </header>
  );
};

export default Topbar;
