import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRightIcon,
  DatabaseIcon,
  LayoutGridIcon,
  RecycleIcon,
} from "lucide-react";

import { Link, useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";

type NavItem = {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  visualTo?: string;
};

const navItems: ReadonlyArray<NavItem> = [
  {
    label: "Home",
    description: "Search hub & quick intel",
    to: "/",
    icon: LayoutGridIcon,
  },
  {
    label: "Recycle Profit",
    description: "Optimizer & scrap margins",
    to: "/items/recycles",
    icon: RecycleIcon,
  },
];

export default function Header() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname.replace(/\/+$/, "") || "/",
  });

  const isActive = (to: string) => {
    if (to === "/") {
      return pathname === "/" || pathname === "/index";
    }

    return pathname.startsWith(to);
  };

  return (
    <div className="top-0 z-40 relative flex justify-center">
      <header className="fixed w-7xl border border-border/60 bg-background/80 backdrop-blur-sm flex items-center justify-between p-2 mt-2 rounded-full">
        <Link
          to="/"
          preload="intent"
          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 p-1.5 text-sm font-medium transition hover:border-primary/60"
          aria-label="Topside DB home"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
            <DatabaseIcon className="h-3 w-3" />
          </span>
          <span className="text-[0.65rem] uppercase tracking-[0.5em] text-muted-foreground">
            Topside <span className="text-primary">DB</span>
          </span>
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mr-auto ml-4 overflow-x-auto">
          <span className="text-muted-foreground">•</span>
          <nav className="flex-1">
            <ul className="flex min-w-fit items-center gap-2">
              {navItems.map(({ icon: Icon, label, to, visualTo }) => {
                const active = isActive(to);
                return (
                  <li key={label}>
                    <Link
                      to={to}
                      preload="intent"
                      className={cn(
                        "group flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition whitespace-nowrap",
                        active
                          ? "border-primary/70 bg-primary/10 text-primary shadow-sm"
                          : "border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="leading-none">
                        {label}
                        {visualTo && (
                          <span className="ml-2 text-[0.65rem] font-normal uppercase tracking-[0.4em] text-muted-foreground/80">
                            {visualTo}
                          </span>
                        )}
                      </span>
                      <ArrowUpRightIcon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <ModeToggle />
      </header>
    </div>
  );
}
