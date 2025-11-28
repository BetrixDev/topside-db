import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon, MapIcon, ArrowRightIcon, ClockIcon } from "lucide-react";
import type { MapSearchHit } from "@topside-db/schemas";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { seo } from "@/lib/seo";

const mapsSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/maps")({
  component: MapsPage,
  validateSearch: zodValidator(mapsSearchSchema),
  loaderDeps: ({ search: { q } }) => ({ q }),
  loader: ({ context, deps: { q } }) => {
    context.queryClient.ensureQueryData(
      orpc.search.search.queryOptions({
        input: {
          query: q,
          category: "maps",
          limit: 50,
        },
        staleTime: 1000 * 60 * 15,
      })
    );
  },
  head: () => ({
    meta: [
      ...seo({
        title: "Maps | Topside DB",
        description:
          "Browse all raid locations in Arc Raiders. Find map information, time limits, and location details.",
        keywords:
          "arc raiders, database, maps, locations, raids, time limit, areas",
      }),
    ],
  }),
});

function MapsPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [inputValue, setInputValue] = React.useState(q);

  React.useEffect(() => {
    setInputValue(q);
  }, [q]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== q) {
        navigate({
          search: { q: inputValue || undefined },
          replace: true,
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, q, navigate]);

  const { data, isLoading, isFetching } = useQuery(
    orpc.search.search.queryOptions({
      input: {
        query: q,
        category: "maps",
        limit: 50,
      },
      staleTime: 1000 * 60 * 15,
    })
  );

  const maps = (data?.hits ?? []) as MapSearchHit[];
  const hasSearched = q.length > 0;

  return (
    <main className="min-h-screen relative overflow-hidden pt-20 pb-12">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <FlickeringGrid
          className="z-0 absolute inset-0 size-full"
          squareSize={6}
          gridGap={12}
          color="#3B82F6"
          maxOpacity={0.25}
          flickerChance={0.03}
        />
      </div>

      {/* Gradient overlays for depth */}
      <div className="fixed inset-0 bg-linear-to-b from-background via-transparent to-background pointer-events-none" />
      <div className="fixed inset-0 bg-linear-to-r from-background/50 via-transparent to-background/50 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header Section */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 flex items-center justify-center">
              <MapIcon className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Maps</h1>
              <p className="text-muted-foreground text-sm">
                Explore all raid locations in Arc Raiders
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative mt-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon
                className={cn(
                  "w-5 h-5 transition-colors duration-200",
                  inputValue ? "text-blue-500" : "text-muted-foreground"
                )}
              />
            </div>
            <Input
              type="text"
              placeholder="Search for maps by name or location..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full h-14 pl-12 pr-4 text-lg rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm shadow-lg focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20 transition-all placeholder:text-muted-foreground/60"
            />
            {isFetching && (
              <div className="absolute inset-y-0 right-4 flex items-center">
                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </header>

        {/* Results Section */}
        <section>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <MapCardSkeleton key={i} delay={i * 50} />
              ))}
            </div>
          ) : maps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-3xl bg-muted/50 border border-border flex items-center justify-center mb-6">
                <SearchIcon className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h2 className="text-xl font-semibold text-foreground/80 mb-2">
                No Maps Found
              </h2>
              <p className="text-muted-foreground max-w-md">
                We couldn't find any maps matching "{q}". Try adjusting your
                search terms.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {maps.length}
                  </span>{" "}
                  map{maps.length !== 1 ? "s" : ""} found
                  {typeof data?.processingTimeMs === "number" && (
                    <span className="ml-2 font-mono text-xs text-muted-foreground/70">
                      ({data.processingTimeMs}ms)
                    </span>
                  )}
                </p>
              </div>
              <div className="space-y-2">
                {maps.map((map, index) => (
                  <MapCard key={map.id} map={map} index={index} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function MapCard({ map, index }: { map: MapSearchHit; index: number }) {
  return (
    <Link
      to="/maps/$mapId"
      params={{ mapId: map.id }}
      className="group block"
      style={{
        animationDelay: `${index * 30}ms`,
      }}
    >
      <div
        className={cn(
          "relative flex items-center gap-4 p-4 rounded-2xl",
          "bg-card/60 backdrop-blur-sm border border-border/40",
          "hover:bg-card/90 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5",
          "transition-all duration-300 ease-out",
          "animate-in fade-in slide-in-from-bottom-2"
        )}
      >
        {/* Map Image */}
        <div className="relative w-16 h-16 rounded-xl bg-linear-to-br from-background to-muted/50 border border-border/30 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-blue-500/30 transition-colors">
          {map.imageUrl ? (
            <img
              src={map.imageUrl}
              alt={map.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <MapIcon className="w-7 h-7 text-muted-foreground/50" />
          )}
        </div>

        {/* Map Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-blue-500 transition-colors truncate">
            {map.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {map.maximumTimeMinutes && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <ClockIcon className="w-3 h-3" />
                {map.maximumTimeMinutes} min
              </span>
            )}
            <span className="text-xs text-muted-foreground font-mono">
              ID: {map.id}
            </span>
          </div>
          {map.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {map.description}
            </p>
          )}
        </div>

        {/* Arrow indicator */}
        <div className="shrink-0 w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5">
          <ArrowRightIcon className="w-4 h-4 text-blue-500" />
        </div>
      </div>
    </Link>
  );
}

function MapCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-2xl bg-card/40 border border-border/20"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  );
}
