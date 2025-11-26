import type { LucideIcon } from "lucide-react";
import {
  ArchiveIcon,
  BotIcon,
  DatabaseIcon,
  HammerIcon,
  MapIcon,
  MenuIcon,
  RecycleIcon,
  ScrollTextIcon,
  SearchIcon,
  ShoppingBagIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { useIsMobile } from "../lib/hooks/use-mobile";
import { ModeToggle } from "./mode-toggle";
import { useSpotlight } from "./spotlight-search";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { Button } from "./ui/button";

type PageItem = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

const databasePages: ReadonlyArray<PageItem> = [
  {
    title: "Items",
    href: "/items",
    description: "Browse all in-game items, weapons, gear, and resources",
    icon: ArchiveIcon,
  },
  {
    title: "Traders",
    href: "/traders",
    description: "Discover traders, their inventories and barter deals",
    icon: ShoppingBagIcon,
  },
  {
    title: "Arcs",
    href: "/arcs",
    description: "Explore Arc information and their unique characteristics",
    icon: BotIcon,
  },
  {
    title: "Hideout",
    href: "/hideout",
    description: "Workbench upgrades and crafting station details",
    icon: HammerIcon,
  },
  {
    title: "Quests",
    href: "/quests",
    description: "Track quests, objectives, and completion rewards",
    icon: ScrollTextIcon,
  },
  {
    title: "Maps",
    href: "/maps",
    description: "",
    icon: MapIcon,
  },
];

const toolPages: ReadonlyArray<PageItem> = [
  {
    title: "Recycle Profit",
    href: "/items/recycles",
    description: "Calculate optimal recycling profits and scrap margins",
    icon: RecycleIcon,
  },
  // Add more tools here in the future
];

export default function Header() {
  const { setOpen } = useSpotlight();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="top-0 z-30 relative flex justify-center">
      <header className="fixed w-full max-w-7xl border border-border/60 bg-background/80 backdrop-blur-sm flex items-center justify-between p-2 mt-2 mx-2 rounded-full">
        {/* Logo */}
        <Link
          to="/"
          preload="intent"
          className="h-10 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 p-1.5 text-sm font-medium transition hover:border-primary/60"
          aria-label="Topside DB home"
        >
          <DatabaseIcon className="h-4 w-4 text-primary md:ml-1" />
          <span className="hidden sm:inline text-[0.65rem] uppercase tracking-[0.5em] text-muted-foreground">
            Topside <span className="text-primary">DB</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2 ml-4">
          <NavigationMenu viewport={!isMobile}>
            <NavigationMenuList>
              {/* Pages Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-8 rounded-full border border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground data-[state=open]:border-primary/70 data-[state=open]:bg-primary/10 data-[state=open]:text-primary">
                  Pages
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-2 p-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    {/* Featured Card */}
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          to="/"
                          className="from-primary/20 via-primary/10 to-muted/50 flex h-full w-full flex-col justify-end rounded-lg bg-linear-to-b p-4 no-underline outline-none transition-all duration-200 select-none hover:shadow-md focus:shadow-md border border-border/40 hover:border-primary/40"
                        >
                          <DatabaseIcon className="h-8 w-8 text-primary mb-2" />
                          <div className="mb-1 text-base font-semibold">
                            Homepage
                          </div>
                          <p className="text-muted-foreground text-sm leading-tight">
                            Search and explore the complete Arc Raiders database
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    {/* Page Links */}
                    {databasePages.slice(0, 3).map((page) => (
                      <ListItem
                        key={page.title}
                        title={page.title}
                        href={page.href}
                        icon={page.icon}
                      >
                        {page.description}
                      </ListItem>
                    ))}
                  </ul>
                  <ul className="grid gap-2 p-2 pt-0 md:w-[400px] md:grid-cols-2 lg:w-[500px]">
                    {databasePages.slice(3).map((page) => (
                      <ListItem
                        key={page.title}
                        title={page.title}
                        href={page.href}
                        icon={page.icon}
                      >
                        {page.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Tools Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-8 rounded-full border border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground data-[state=open]:border-primary/70 data-[state=open]:bg-primary/10 data-[state=open]:text-primary">
                  Tools
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-2 p-2 w-[350px]">
                    {toolPages.map((page) => (
                      <ListItem
                        key={page.title}
                        title={page.title}
                        href={page.href}
                        icon={page.icon}
                      >
                        {page.description}
                      </ListItem>
                    ))}
                    {/* Placeholder for future tools */}
                    <li className="rounded-lg border border-dashed border-border/60 p-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        More tools coming soon!
                      </p>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1.5 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            <SearchIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/60 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          <ModeToggle />

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-full border border-border/60 bg-card/40 text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <XIcon className="h-4 w-4" />
            ) : (
              <MenuIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-background/95 backdrop-blur-sm pt-4 px-4 ">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setMobileMenuOpen(false)}>
              Close Menu
            </Button>
          </div>
          <nav className="py-6 space-y-6 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {/* Database Pages Section */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">
                Database
              </h3>
              <ul className="space-y-1">
                {databasePages.map((page) => (
                  <li key={page.title}>
                    <Link
                      to={page.href}
                      preload="intent"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground transition hover:bg-primary/10 hover:text-primary"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/60">
                        <page.icon className="h-4 w-4 text-primary" />
                      </span>
                      <div>
                        <div className="font-medium">{page.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {page.description}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tools Section */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">
                Tools
              </h3>
              <ul className="space-y-1">
                {toolPages.map((page) => (
                  <li key={page.title}>
                    <Link
                      to={page.href}
                      preload="intent"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground transition hover:bg-primary/10 hover:text-primary"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/60">
                        <page.icon className="h-4 w-4 text-primary" />
                      </span>
                      <div>
                        <div className="font-medium">{page.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {page.description}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="pt-4">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-card/40 px-4 py-3 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                <SearchIcon className="h-4 w-4" />
                <span>Search Database</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}

function ListItem({
  title,
  children,
  href,
  icon: Icon,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & {
  href: string;
  icon: LucideIcon;
}) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          to={href}
          preload="intent"
          className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50 focus:bg-accent/50 outline-none border border-border/60"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-card/60 mt-0.5">
            <Icon className="h-4 w-4 text-primary" />
          </span>
          <div className="space-y-1">
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="text-muted-foreground line-clamp-2 text-xs leading-snug">
              {children}
            </p>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
