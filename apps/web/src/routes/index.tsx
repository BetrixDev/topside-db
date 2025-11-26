import { createFileRoute, Link } from "@tanstack/react-router";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { SpotlightSearchInput } from "@/components/spotlight-search";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import {
  ArchiveIcon,
  MapIcon,
  HammerIcon,
  BotIcon,
  EyeIcon,
  TrendingUpIcon,
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

      <div className="absolute right-0 top-0 z-10 w-full lg:w-96 lg:p-6 pb-12 lg:pb-0 lg:overflow-y-auto mt-16">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full backdrop-blur-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center">
              <TrendingUpIcon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Most Viewed</h2>
              <p className="text-xs text-muted-foreground">Popular resources</p>
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
