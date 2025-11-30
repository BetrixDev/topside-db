import { SectionCard, QuestCard } from "@/components/resource-cards";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  PackageIcon,
  ScrollTextIcon,
  CoinsIcon,
  SproutIcon,
  SparklesIcon,
  TagIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { startCase } from "es-toolkit/string";
import { usePageView } from "@/lib/hooks/use-page-view";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";

// Square grid cell for items
interface ItemGridCellProps {
  itemId: string;
  name?: string | null;
  imageUrl?: string | null;
  className?: string;
}

function ItemGridCell({
  itemId,
  name,
  imageUrl,
  className,
}: ItemGridCellProps) {
  return (
    <Link
      to="/items/$itemId"
      params={{ itemId }}
      className={cn(
        "group relative aspect-square rounded-lg bg-background/60 overflow-hidden transition-all duration-300 hover:bg-background/80 hover:shadow-xl hover:shadow-black/20 hover:scale-[1.02]",
        className
      )}
    >
      {/* Item image - full cell */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name ?? "Item"}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-md"
          />
        ) : (
          <PackageIcon className="w-10 h-10 text-muted-foreground/30" />
        )}
      </div>

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

      {/* Item name overlay */}
      <div className="absolute inset-x-0 bottom-0 p-2">
        <p className="text-xs font-medium text-white/90 truncate text-center drop-shadow-sm group-hover:text-white transition-colors">
          {name ?? itemId}
        </p>
      </div>
    </Link>
  );
}

export const Route = createFileRoute("/traders_/$traderId")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    return await context.queryClient.ensureQueryData(
      orpc.traders.getTrader.queryOptions({
        input: { id: params.traderId },
      })
    );
  },
  head: ({ loaderData }) => ({
    meta: [
      ...seo({
        title: `${loaderData?.name ?? "Unknown"} | Topside DB`,
        description: `View detailed information about the trader ${
          loaderData?.name ?? "Unknown"
        } in Arc Raiders. See items for sale, quests, and more.`,
        keywords: `arc raiders, database, search engine, trader, ${
          loaderData?.name ?? "Unknown"
        }`,
        image: loaderData?.imageUrl ?? undefined,
      }),
    ],
  }),
});

function RouteComponent() {
  const params = Route.useParams();

  const { data } = useQuery(
    orpc.traders.getTrader.queryOptions({
      input: { id: params.traderId },
    })
  );

  usePageView("trader", params.traderId, !!data);

  const itemsByCurrency = data?.itemsByCurrency ?? {
    credits: [],
    seeds: [],
    augment: [],
  };
  const quests = data?.quests ?? [];
  const stats = data?.stats;
  const sellCategories = data?.sellCategories ?? [];

  const currencyConfig = {
    credits: {
      icon: CoinsIcon,
      label: "Credits",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    seeds: {
      icon: SproutIcon,
      label: "Seeds",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    augment: {
      icon: SparklesIcon,
      label: "Augment",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/20",
    },
  };

  return (
    <div className="min-h-screen md:px-0 px-4">
      <main className="max-w-7xl mx-auto py-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Trader Profile */}
          <div className="lg:col-span-1">
            <div className="bg-secondary rounded-lg border border-border/50 p-6 sticky top-20">
              <div className="relative aspect-square bg-linear-to-br from-accent/10 to-background rounded-lg border border-border/50 overflow-hidden mb-4 flex items-center justify-center group">
                <div className="absolute inset-0 bg-linear-to-br from-accent/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {data?.imageUrl ? (
                  <img
                    src={data.imageUrl}
                    alt={data?.name ?? "Trader"}
                    className="w-full h-full object-cover z-10"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-4xl font-bold text-muted-foreground">
                      {data?.name?.charAt(0) ?? "?"}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items for Sale</span>
                  <span className="font-medium">
                    {stats?.totalItemsForSale ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quests</span>
                  <span className="font-medium">{stats?.totalQuests ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categories</span>
                  <span className="font-medium">
                    {stats?.uniqueCategories ?? 0}
                  </span>
                </div>
              </div>

              {/* Wiki Link */}
              {data?.wikiUrl && (
                <a
                  href={data.wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg border border-primary/30 hover:bg-primary/20 transition-colors text-sm font-medium"
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                  View on Wiki
                </a>
              )}
            </div>
          </div>

          {/* Right Column - Trader Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Description */}
            <div>
              <h1 className="text-4xl font-bold mb-3 text-balance">
                {data?.name ?? "Unknown Trader"}
              </h1>
              {sellCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {sellCategories.map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full flex items-center gap-1"
                    >
                      <TagIcon className="w-3 h-3" />
                      {startCase(category)}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-muted-foreground leading-relaxed">
                {data?.description ?? "No description available"}
              </p>
            </div>

            {/* Quests Section */}
            {quests.length > 0 && (
              <SectionCard icon={ScrollTextIcon} title="Quests">
                <p className="text-sm text-muted-foreground mb-3">
                  Complete these quests for {data?.name}:
                </p>
                <div className="flex flex-col gap-2">
                  {quests.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      questId={quest.id}
                      name={quest.name}
                    />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Items for Sale - Credits */}
            {itemsByCurrency.credits.length > 0 && (
              <SectionCard
                icon={currencyConfig.credits.icon}
                title={`Items for Credits (${itemsByCurrency.credits.length})`}
              >
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {itemsByCurrency.credits.map((sale) => (
                    <ItemGridCell
                      key={sale.itemId}
                      itemId={sale.itemId}
                      name={sale.item?.name}
                      imageUrl={sale.item?.imageFilename}
                    />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Items for Sale - Seeds */}
            {itemsByCurrency.seeds.length > 0 && (
              <SectionCard
                icon={currencyConfig.seeds.icon}
                title={`Items for Seeds (${itemsByCurrency.seeds.length})`}
              >
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {itemsByCurrency.seeds.map((sale) => (
                    <ItemGridCell
                      key={sale.itemId}
                      itemId={sale.itemId}
                      name={sale.item?.name}
                      imageUrl={sale.item?.imageFilename}
                    />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Items for Sale - Augment */}
            {itemsByCurrency.augment.length > 0 && (
              <SectionCard
                icon={currencyConfig.augment.icon}
                title={`Items for Augment (${itemsByCurrency.augment.length})`}
              >
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {itemsByCurrency.augment.map((sale) => (
                    <ItemGridCell
                      key={sale.itemId}
                      itemId={sale.itemId}
                      name={sale.item?.name}
                      imageUrl={sale.item?.imageFilename}
                    />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Empty State */}
            {stats?.totalItemsForSale === 0 && quests.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <PackageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No items or quests found for this trader.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
