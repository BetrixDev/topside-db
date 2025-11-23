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
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import {
  ArchiveIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  SearchIcon,
  MapIcon,
  HammerIcon,
  BotIcon,
  UserIcon,
  EyeIcon,
  TrendingUpIcon,
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

  const { data: highestViewedResources } = useQuery(
    orpc.analytics.getHighestViewedResources.queryOptions({
      staleTime: 1000 * 60 * 10,
    })
  );

  const searchResults = data?.hits ?? [];

  return (
    <div className="min-h-screen bg-background">
      <main className="min-h-screen flex flex-col lg:flex-row px-4 relative overflow-hidden">
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

        <div className="relative z-10 w-full lg:flex-1 flex flex-col items-center justify-center py-12 lg:py-0">
          <div className="w-full max-w-2xl">
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

                        if (result.kind === "maps") {
                          return (
                            <Link
                              to="/map/$mapId"
                              params={{ mapId: result.id }}
                              key={result.id}
                              preload="intent"
                            >
                              <CommandItem
                                value={result.name ?? undefined}
                                className="rounded-lg hover:bg-background/50 cursor-pointer transition-colors mb-1 p-3"
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className="w-12 h-12 bg-background rounded-lg border border-border/30 flex items-center justify-center overflow-hidden shrink-0">
                                    {result.imageUrl ? (
                                      <img
                                        src={result.imageUrl ?? undefined}
                                        alt={result.name}
                                        className="w-full h-full object-cover object-center"
                                      />
                                    ) : (
                                      <MapIcon className="w-6 h-6 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                      {result.name}
                                    </p>
                                    <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                      Map
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
                                      <span className="text-primary">
                                        Module
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CommandItem>
                            </Link>
                          );
                        }

                        if (result.kind === "arcs") {
                          return (
                            <Link
                              to="/arc/$arcId"
                              params={{ arcId: result.id }}
                              key={result.id}
                              preload="intent"
                            >
                              <CommandItem
                                value={result.name ?? undefined}
                                className="rounded-lg hover:bg-background/50 cursor-pointer transition-colors mb-1 p-3"
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className="w-12 h-12 bg-background rounded-lg border border-border/30 flex items-center justify-center overflow-hidden shrink-0">
                                    {result.imageUrl ? (
                                      <img
                                        src={result.imageUrl ?? undefined}
                                        alt={result.name}
                                        className="w-full h-full object-cover object-center"
                                      />
                                    ) : (
                                      <BotIcon className="w-6 h-6 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                      {result.name}
                                    </p>
                                    <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                      Arc
                                    </div>
                                  </div>
                                </div>
                              </CommandItem>
                            </Link>
                          );
                        }

                        if (result.kind === "traders") {
                          return (
                            <Link
                              to="/trader/$traderId"
                              params={{ traderId: result.id }}
                              key={result.id}
                              preload="intent"
                            >
                              <CommandItem
                                value={result.name ?? undefined}
                                className="rounded-lg hover:bg-background/50 cursor-pointer transition-colors mb-1 p-3"
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className="w-12 h-12 bg-background rounded-lg border border-border/30 flex items-center justify-center overflow-hidden shrink-0">
                                    {result.imageUrl ? (
                                      <img
                                        src={result.imageUrl ?? undefined}
                                        alt={result.name}
                                        className="w-full h-full object-cover object-center"
                                      />
                                    ) : (
                                      <UserIcon className="w-6 h-6 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                      {result.name}
                                    </p>
                                    <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                      Arc
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
        </div>

        <div className="absolute right-0 top-0 z-10 w-full lg:w-96 lg:p-6 pb-12 lg:pb-0 lg:overflow-y-auto mt-16">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full backdrop-blur-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center">
                <TrendingUpIcon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Most Viewed</h2>
                <p className="text-xs text-muted-foreground">
                  Popular resources
                </p>
              </div>
            </div>

            {!highestViewedResources || highestViewedResources.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No view data available yet
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {highestViewedResources.map((resource) => (
                  <ViewedResourceCard
                    key={`${resource.resourceType}:${resource.resourceId}`}
                    resource={resource}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ViewedResourceCard({
  resource,
}: {
  resource: {
    resourceType: string;
    resourceId: string;
    viewCount: number;
  };
}) {
  const getResourceLink = () => {
    switch (resource.resourceType) {
      case "item":
        return `/item/${resource.resourceId}`;
      case "quest":
        return `/quest/${resource.resourceId}`;
      case "hideout":
        return `/hideout/${resource.resourceId}`;
      case "map":
        return `/map/${resource.resourceId}`;
      case "arc":
        return `/arc/${resource.resourceId}`;
      default:
        return "#";
    }
  };

  const getResourceIcon = () => {
    switch (resource.resourceType) {
      case "item":
        return ArchiveIcon;
      case "quest":
        return MapIcon;
      case "hideout":
        return HammerIcon;
      case "map":
        return MapIcon;
      case "arc":
        return BotIcon;
      default:
        return ArchiveIcon;
    }
  };

  const Icon = getResourceIcon();

  const { data: displayData } = useQuery(
    orpc.analytics.getDisplayDataForResource.queryOptions({
      input: {
        resourceType: resource.resourceType as any,
        resourceId: resource.resourceId,
      },
    })
  );

  return (
    <Link to={getResourceLink()} preload="intent">
      <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/60 transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          {/* Image placeholder */}
          <div className="w-12 h-12 rounded-lg bg-background border border-border/30 flex items-center justify-center overflow-hidden shrink-0">
            {displayData?.imageUrl ? (
              <img
                src={displayData.imageUrl}
                alt={displayData.name ?? ""}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <Icon className="w-6 h-6 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {/* Name placeholder */}
              <span className="text-muted-foreground">
                {displayData?.name ??
                  resource.resourceType.charAt(0).toUpperCase() +
                    resource.resourceType.slice(1)}
              </span>
            </p>
          </div>

          {/* View count */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-primary">
              <EyeIcon className="w-3 h-3" />
              <span className="text-sm font-semibold">
                {resource.viewCount.toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">views</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
