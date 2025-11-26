"use client";

import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  SearchIcon,
  MapIcon,
  HammerIcon,
  BotIcon,
  UserIcon,
  PackageIcon,
  type LucideIcon,
} from "lucide-react";
import type {
  SearchHit,
  ItemSearchHit,
  QuestSearchHit,
  HideoutSearchHit,
  MapSearchHit,
  ArcSearchHit,
  TraderSearchHit,
} from "@topside-db/schemas";

// Create a context to control the spotlight from anywhere
interface SpotlightContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SpotlightContext = React.createContext<SpotlightContextValue | null>(
  null
);

export function useSpotlight() {
  const context = React.useContext(SpotlightContext);
  if (!context) {
    throw new Error("useSpotlight must be used within a SpotlightProvider");
  }
  return context;
}

export function SpotlightProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <SpotlightContext.Provider value={{ open, setOpen }}>
      {children}
      <SpotlightDialog open={open} onOpenChange={setOpen} />
    </SpotlightContext.Provider>
  );
}

function SpotlightDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const navigate = useNavigate();

  const { data } = useQuery(
    orpc.search.search.queryOptions({
      input: { query: searchQuery },
      staleTime: 1000 * 60 * 5,
    })
  );

  const searchResults = data?.hits ?? [];

  // Reset search when dialog closes
  React.useEffect(() => {
    if (!open) {
      // Small delay to allow close animation
      const timeout = setTimeout(() => setSearchQuery(""), 150);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  const handleSelect = (url: string) => {
    onOpenChange(false);
    navigate({ to: url });
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Topside DB"
      description="Search for items, quests, maps, and more..."
      className="sm:max-w-2xl border-accent"
    >
      <CommandInput
        placeholder="Search for anything Arc Raiders..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty className="py-12 text-center text-muted-foreground">
          {searchQuery ? "No results found." : "Start typing to search..."}
        </CommandEmpty>
        {searchResults.length > 0 && (
          <CommandGroup
            heading={
              <span>
                <span className="font-bold">
                  {searchResults.length} Result
                  {searchResults.length !== 1 ? "s" : ""}
                </span>
                {typeof data?.processingTimeMs === "number" && (
                  <span className="ml-2 text-xs text-muted-foreground font-mono">
                    ({data.processingTimeMs}ms)
                  </span>
                )}
              </span>
            }
            className="p-2"
          >
            {searchResults.map((result) => (
              <SearchResultItem
                key={`${result.kind}-${result.id}`}
                result={result}
                onSelect={handleSelect}
              />
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

// Type-safe search result item component using discriminated union
function SearchResultItem({
  result,
  onSelect,
}: {
  result: SearchHit;
  onSelect: (url: string) => void;
}) {
  switch (result.kind) {
    case "items":
      return <ItemResultItem result={result} onSelect={onSelect} />;
    case "quests":
      return <QuestResultItem result={result} onSelect={onSelect} />;
    case "hideouts":
      return <HideoutResultItem result={result} onSelect={onSelect} />;
    case "maps":
      return <MapResultItem result={result} onSelect={onSelect} />;
    case "arcs":
      return <ArcResultItem result={result} onSelect={onSelect} />;
    case "traders":
      return <TraderResultItem result={result} onSelect={onSelect} />;
  }
}

// Reusable result item wrapper
function ResultItemWrapper({
  id,
  name,
  url,
  icon: Icon,
  label,
  sublabel,
  imageUrl,
  imageClassName,
  onSelect,
}: {
  id: string;
  name: string;
  url: string;
  icon: LucideIcon;
  label: string;
  sublabel?: string | null;
  imageUrl?: string | null;
  imageClassName?: string;
  onSelect: (url: string) => void;
}) {
  return (
    <CommandItem
      key={id}
      value={name}
      onSelect={() => onSelect(url)}
      className="rounded-lg hover:bg-background/50 cursor-pointer transition-colors mb-1 p-3"
    >
      <div className="flex items-center gap-3 w-full">
        <div className="w-12 h-12 bg-background rounded-lg border border-border/30 flex items-center justify-center overflow-hidden shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className={
                imageClassName ?? "w-full h-full object-cover object-center"
              }
            />
          ) : (
            <Icon className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{name}</p>
          <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
            <span>{label}</span>
            {sublabel && (
              <>
                <span>&gt;</span>
                <span className="text-primary">{sublabel}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </CommandItem>
  );
}

// Individual type-safe result components
function ItemResultItem({
  result,
  onSelect,
}: {
  result: ItemSearchHit;
  onSelect: (url: string) => void;
}) {
  return (
    <ResultItemWrapper
      id={result.id}
      name={result.name}
      url={`/items/${result.id}`}
      icon={PackageIcon}
      label="Item"
      sublabel={result.type}
      imageUrl={result.imageFilename}
      imageClassName="w-full h-full object-contain p-1"
      onSelect={onSelect}
    />
  );
}

function QuestResultItem({
  result,
  onSelect,
}: {
  result: QuestSearchHit;
  onSelect: (url: string) => void;
}) {
  return (
    <ResultItemWrapper
      id={result.id}
      name={result.name}
      url={`/quests/${result.id}`}
      icon={MapIcon}
      label="Quest"
      sublabel={result.trader}
      onSelect={onSelect}
    />
  );
}

function HideoutResultItem({
  result,
  onSelect,
}: {
  result: HideoutSearchHit;
  onSelect: (url: string) => void;
}) {
  return (
    <ResultItemWrapper
      id={result.id}
      name={result.name}
      url={`/hideout/${result.id}`}
      icon={HammerIcon}
      label="Hideout"
      sublabel="Module"
      onSelect={onSelect}
    />
  );
}

function MapResultItem({
  result,
  onSelect,
}: {
  result: MapSearchHit;
  onSelect: (url: string) => void;
}) {
  return (
    <ResultItemWrapper
      id={result.id}
      name={result.name}
      url={`/maps/${result.id}`}
      icon={MapIcon}
      label="Map"
      imageUrl={result.imageUrl}
      onSelect={onSelect}
    />
  );
}

function ArcResultItem({
  result,
  onSelect,
}: {
  result: ArcSearchHit;
  onSelect: (url: string) => void;
}) {
  return (
    <ResultItemWrapper
      id={result.id}
      name={result.name}
      url={`/arcs/${result.id}`}
      icon={BotIcon}
      label="Arc"
      sublabel={result.threatLevel}
      imageUrl={result.imageUrl}
      onSelect={onSelect}
    />
  );
}

function TraderResultItem({
  result,
  onSelect,
}: {
  result: TraderSearchHit;
  onSelect: (url: string) => void;
}) {
  return (
    <ResultItemWrapper
      id={result.id}
      name={result.name}
      url={`/traders/${result.id}`}
      icon={UserIcon}
      label="Trader"
      imageUrl={result.imageUrl}
      onSelect={onSelect}
    />
  );
}

// Trigger button for opening the spotlight (can be used in header, etc.)
export function SpotlightTrigger({ className }: { className?: string }) {
  const { setOpen } = useSpotlight();

  return (
    <button
      onClick={() => setOpen(true)}
      className={`flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors ${
        className ?? ""
      }`}
    >
      <SearchIcon className="w-4 h-4" />
      <span className="hidden sm:inline">Search</span>
      <kbd className="bg-muted text-muted-foreground pointer-events-none hidden sm:inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}

// Prominent search input for homepage - mimics an input field but opens the spotlight
export function SpotlightSearchInput({ className }: { className?: string }) {
  const { setOpen } = useSpotlight();

  return (
    <button
      onClick={() => setOpen(true)}
      className={`w-full group cursor-text ${className ?? ""}`}
    >
      <div className="relative flex items-center gap-3 rounded-xl border-2 border-border/40 bg-card/80 backdrop-blur-sm px-5 py-4 shadow-lg transition-all duration-200 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
          <SearchIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-lg text-muted-foreground/70 transition-colors group-hover:text-muted-foreground">
            Search for anything Arc Raiders...
          </p>
          <p className="text-xs text-muted-foreground/50 mt-0.5">
            Items, quests, maps, arcs, traders and more
          </p>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/50 px-3 py-2 font-mono text-sm font-medium text-muted-foreground shadow-sm transition-colors group-hover:border-primary/40 group-hover:text-primary">
          <span>⌘</span>
          <span>K</span>
        </kbd>
      </div>
    </button>
  );
}
