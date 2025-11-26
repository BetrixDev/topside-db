import { createFileRoute, Link } from "@tanstack/react-router";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { SpotlightSearchInput } from "@/components/spotlight-search";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { cn } from "@/lib/utils";
import {
  ArchiveIcon,
  MapIcon,
  HammerIcon,
  BotIcon,
  EyeIcon,
  ShoppingBagIcon,
  FlameIcon,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const { data: highestViewedResources } = useQuery(
    orpc.analytics.getHighestViewedResources.queryOptions({
      staleTime: 1000 * 60 * 10,
      refetchOnMount: false,
    })
  );

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
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

      {/* Hero Section */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center py-16 lg:py-24 px-4 mt-24 mb-12">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-3 text-balance text-foreground">
              Topside <span className="text-primary">DB</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Arc Raiders database and search engine
            </p>
          </div>

          {/* Search - Click to open spotlight */}
          <SpotlightSearchInput />
        </div>
      </div>

      {/* Most Viewed Section */}
      <div className="relative z-10 w-full pb-8 lg:pb-12">
        <div className="px-4 lg:px-8 max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-sm">
              <FlameIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Most viewed
              </h2>
              <p className="text-sm text-muted-foreground">
                Most viewed pages currently
              </p>
            </div>
          </div>

          {!highestViewedResources || highestViewedResources.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm rounded-2xl border border-dashed border-border/50 bg-card/30 backdrop-blur-sm">
              No view data available yet
            </div>
          ) : (
            <>
              {/* Mobile: Horizontal scroll */}
              <div className="lg:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
                <div
                  className="flex gap-3 pb-2"
                  style={{ width: "max-content" }}
                >
                  {highestViewedResources.map((resource, index) => (
                    <ViewedResourceCard
                      key={`${resource.resourceType}:${resource.resourceId}`}
                      resource={resource}
                      rank={index + 1}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>

              {/* Desktop: Grid layout */}
              <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {highestViewedResources.map((resource, index) => (
                  <ViewedResourceCard
                    key={`${resource.resourceType}:${resource.resourceId}`}
                    resource={resource}
                    rank={index + 1}
                    variant="default"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function ViewedResourceCard({
  resource,
  rank,
  variant = "default",
}: {
  resource: {
    resourceType: string;
    resourceId: string;
    viewCount: number;
  };
  rank: number;
  variant?: "default" | "compact";
}) {
  const getResourceLink = () => {
    switch (resource.resourceType) {
      case "item":
        return `/items/${resource.resourceId}`;
      case "quest":
        return `/quests/${resource.resourceId}`;
      case "hideout":
        return `/hideout/${resource.resourceId}`;
      case "map":
        return `/maps/${resource.resourceId}`;
      case "arc":
        return `/arcs/${resource.resourceId}`;
      case "trader":
        return `/traders/${resource.resourceId}`;
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
      case "trader":
        return ShoppingBagIcon;
      default:
        return ArchiveIcon;
    }
  };

  const getResourceLabel = () => {
    switch (resource.resourceType) {
      case "item":
        return "Item";
      case "quest":
        return "Quest";
      case "hideout":
        return "Hideout";
      case "map":
        return "Map";
      case "arc":
        return "Arc";
      case "trader":
        return "Trader";
      default:
        return "Resource";
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

  // Rank badge styles
  const getRankStyles = () => {
    if (rank === 1) {
      return "bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 shadow-amber-500/30";
    }
    if (rank === 2) {
      return "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 shadow-slate-400/30";
    }
    if (rank === 3) {
      return "bg-gradient-to-br from-orange-400 to-orange-600 text-orange-950 shadow-orange-500/30";
    }
    return "bg-muted text-muted-foreground";
  };

  if (variant === "compact") {
    return (
      <Link to={getResourceLink()} preload="intent" className="block">
        <div
          className={cn(
            "group relative w-44 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-3",
            "transition-all duration-300 ease-out",
            "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
            "animate-in fade-in slide-in-from-bottom-2"
          )}
          style={{
            animationDelay: `${rank * 50}ms`,
            animationFillMode: "both",
          }}
        >
          {/* Rank Badge */}
          <div
            className={cn(
              "absolute -top-2 -left-2 w-7 h-7 rounded-lg flex items-center justify-center",
              "text-xs font-bold shadow-md z-10",
              getRankStyles()
            )}
          >
            {rank}
          </div>

          {/* Image */}
          <div className="relative w-full aspect-square rounded-xl bg-linear-to-br from-background to-muted/50 border border-border/30 flex items-center justify-center overflow-hidden mb-3">
            {displayData?.imageUrl ? (
              <img
                src={displayData.imageUrl}
                alt={displayData.name ?? ""}
                className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <Icon className="w-8 h-8 text-muted-foreground/60" />
            )}
            {/* Type badge overlay */}
            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-background/90 backdrop-blur-sm border border-border/50 text-[10px] font-medium text-muted-foreground">
              {getResourceLabel()}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium truncate leading-tight text-foreground group-hover:text-primary transition-colors">
              {displayData?.name ?? "Loading..."}
            </p>
            <div className="flex items-center gap-1 text-muted-foreground">
              <EyeIcon className="w-3 h-3" />
              <span className="text-xs font-medium">
                {resource.viewCount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={getResourceLink()} preload="intent" className="block">
      <div
        className={cn(
          "group relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-4",
          "transition-all duration-300 ease-out",
          "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1",
          "animate-in fade-in slide-in-from-bottom-3"
        )}
        style={{ animationDelay: `${rank * 75}ms`, animationFillMode: "both" }}
      >
        {/* Rank Badge */}
        <div
          className={cn(
            "absolute -top-2.5 -left-2.5 w-8 h-8 rounded-xl flex items-center justify-center",
            "text-sm font-bold shadow-md z-10",
            getRankStyles()
          )}
        >
          {rank}
        </div>

        {/* Image */}
        <div className="relative w-full aspect-square rounded-xl bg-linear-to-br from-background to-muted/50 border border-border/30 flex items-center justify-center overflow-hidden mb-3">
          {displayData?.imageUrl ? (
            <img
              src={displayData.imageUrl}
              alt={displayData.name ?? ""}
              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <Icon className="w-10 h-10 text-muted-foreground/60" />
          )}
          {/* Type badge overlay */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-background/90 backdrop-blur-sm border border-border/50 text-xs font-medium text-muted-foreground">
            {getResourceLabel()}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <p className="text-sm font-semibold truncate leading-tight text-foreground group-hover:text-primary transition-colors">
            {displayData?.name ?? "Loading..."}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <EyeIcon className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">
                {resource.viewCount.toLocaleString()} views
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
