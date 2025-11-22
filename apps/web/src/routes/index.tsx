import { createFileRoute, Link } from "@tanstack/react-router";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { FlickeringGrid } from "@/components/ui/shadcn-io/flickering-grid";
import {
  ArchiveIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  SearchIcon,
  MapIcon,
  HammerIcon,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data } = useQuery(
    orpc.search.search.queryOptions({
      input: { query: searchQuery },
      staleTime: 1000 * 60 * 5,
    })
  );

  const searchResults = data?.hits ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArchiveIcon className="w-4 h-4" />
            <span>Database</span>
          </div>
          <Link to="/">
            <div className="text-xs text-muted-foreground">Topside DB</div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Background Grid Effect */}
        <div className="absolute inset-0 opacity-30">
          <FlickeringGrid
            className="z-0 absolute inset-0 size-full"
            squareSize={8}
            gridGap={10}
            color="#6B7280"
            maxOpacity={0.3}
            flickerChance={0.05}
          />
        </div>

        <div className="relative z-10 w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-3 text-balance">
              Topside <span className="text-primary">DB</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Arc Raiders database and search engine
            </p>
          </div>

          {/* Search Command */}
          <div className="bg-secondary rounded-lg border border-border/50 shadow-lg overflow-hidden">
            <Command className="bg-transparent border-none">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                <CommandInput
                  placeholder="Search for anything Arc Raiders..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="border-none focus-visible:ring-0 bg-transparent w-full"
                />
              </div>
              <CommandList className="max-h-[400px] overflow-y-auto">
                <CommandEmpty className="py-12 text-center text-muted-foreground">
                  {searchQuery
                    ? "No results found."
                    : "Start typing to search..."}
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
                    {searchResults.map((result) => {
                      if (result.kind === "quests") {
                        return (
                          <Link
                            to="/quest/$questId"
                            params={{ questId: result.id }}
                            key={result.id}
                            preload="intent"
                          >
                            <CommandItem
                              value={result.name ?? undefined}
                              className="rounded-lg hover:bg-background/50 cursor-pointer transition-colors mb-1 p-3"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className="w-12 h-12 bg-background rounded-lg border border-border/30 flex items-center justify-center overflow-hidden shrink-0">
                                  <MapIcon className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {result.name}
                                  </p>
                                  <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                    <span>Quest &gt;</span>
                                    <span className="text-primary">
                                      {result.trader}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CommandItem>
                          </Link>
                        );
                      }

                      if (result.kind === "hideouts") {
                        return (
                          <Link
                            to="/hideout/$workbenchId"
                            params={{ workbenchId: result.id }}
                            key={result.id}
                            preload="intent"
                          >
                            <CommandItem
                              value={result.name ?? undefined}
                              className="rounded-lg hover:bg-background/50 cursor-pointer transition-colors mb-1 p-3"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className="w-12 h-12 bg-background rounded-lg border border-border/30 flex items-center justify-center overflow-hidden shrink-0">
                                  <HammerIcon className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {result.name}
                                  </p>
                                  <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                    <span>Hideout &gt;</span>
                                    <span className="text-primary">Module</span>
                                  </div>
                                </div>
                              </div>
                            </CommandItem>
                          </Link>
                        );
                      }

                      return (
                        <Link
                          to="/item/$itemId"
                          params={{ itemId: result.id }}
                          key={result.id}
                          preload="intent"
                        >
                          <CommandItem
                            value={result.name ?? undefined}
                            className="rounded-lg hover:bg-background/50 cursor-pointer transition-colors mb-1 p-3"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="w-12 h-12 bg-background rounded-lg border border-border/30 flex items-center justify-center overflow-hidden shrink-0">
                                <img
                                  src={result.imageFilename ?? undefined}
                                  alt={result.name}
                                  className="w-full h-full object-contain p-1"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {result.name}
                                </p>
                                <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                  <span>Item &gt;</span>
                                  <span className="text-primary">
                                    {result.type}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CommandItem>
                        </Link>
                      );
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16 py-6 px-4 text-center text-xs text-muted-foreground">
        <p className="mb-2">
          Game content and materials are trademarks and copyrights of Embark
          Studios and its licensors. All rights reserved.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <span>•</span>
          <Link
            to="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
