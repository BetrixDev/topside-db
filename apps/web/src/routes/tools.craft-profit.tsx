import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/utils/orpc";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArchiveIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUpRightIcon,
  FilterIcon,
  HammerIcon,
  SearchIcon,
  Sparkles,
  TrendingUpIcon,
  WrenchIcon,
} from "lucide-react";
import { seo } from "@/lib/seo";

type CraftingProfitQuery = ReturnType<
  typeof orpc.items.craftingProfitList.queryOptions
>;
type CraftingProfitEntry = Awaited<
  ReturnType<NonNullable<CraftingProfitQuery["queryFn"]>>
>[number];

const sortOptions = [
  { label: "Highest profit", value: "profit" },
  { label: "Best margin", value: "margin" },
  { label: "Sell value", value: "value" },
  { label: "Name A → Z", value: "name" },
] as const;

type SortOption = (typeof sortOptions)[number]["value"];

export const Route = createFileRoute("/tools/craft-profit")({
  head: () => ({
    meta: [
      ...seo({
        title: "Crafting Profit | Topside DB",
        description:
          "Calculate the profit potential of crafting items at hideout stations. Compare material costs vs sell value to find the most profitable crafts in Arc Raiders.",
        keywords:
          "arc raiders, database, crafting, profit, hideout, workbench, materials, arc raiders crafting guide",
        image: "/og/images/crafts.png",
      }),
    ],
  }),
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(
      orpc.items.craftingProfitList.queryOptions()
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("profit");
  const [showProfitableOnly, setShowProfitableOnly] = useState(true);
  const queryClient = useQueryClient();

  const {
    data: crafts = [],
    isLoading,
    isError,
  } = useQuery(orpc.items.craftingProfitList.queryOptions());

  const stats = useMemo(() => computeStats(crafts), [crafts]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...crafts]
      .filter((entry) =>
        term ? entry.itemName.toLowerCase().includes(term) : true
      )
      .filter((entry) =>
        showProfitableOnly ? (entry.profit ?? 0) > 0 : true
      )
      .sort((a, b) => sortEntries(a, b, sortBy));
  }, [crafts, search, showProfitableOnly, sortBy]);

  return (
    <div className="min-h-screen mt-16 md:px-0 px-4">
      <main className="max-w-7xl mx-auto py-8 space-y-10">
        <HeroSection stats={stats} isLoading={isLoading} />

        <section className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for an item to craft..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <label className="text-xs uppercase text-muted-foreground tracking-wide">
                Sort by
              </label>
              <div className="relative">
                <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as SortOption)
                  }
                  className="pl-9 pr-8 h-10 rounded-md border border-border/60 bg-background text-sm focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant={showProfitableOnly ? "default" : "outline"}
                onClick={() => setShowProfitableOnly((prev) => !prev)}
                className="whitespace-nowrap"
              >
                {showProfitableOnly ? (
                  <ArrowUpIcon className="w-4 h-4" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4" />
                )}
                Profitable only
              </Button>
            </div>
          </div>

          {isError && (
            <Card className="border border-destructive/50 bg-destructive/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-destructive">
                    Something went wrong
                  </CardTitle>
                  <CardDescription className="text-destructive/80">
                    Unable to load crafting data right now. Please try again in
                    a moment.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    queryClient.invalidateQueries({
                      queryKey: orpc.items.craftingProfitList.queryKey(),
                    })
                  }
                  className="text-destructive border-destructive/40"
                >
                  Retry
                </Button>
              </CardHeader>
            </Card>
          )}

          {isLoading && crafts.length === 0 ? (
            <Loader />
          ) : filtered.length === 0 ? (
            <EmptyState
              hasSearch={Boolean(search)}
              hasFilter={showProfitableOnly}
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filtered.map((entry, index) => (
                <CraftingCard
                  key={entry.itemId}
                  entry={entry}
                  index={index + 1}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function HeroSection({
  stats,
  isLoading,
}: {
  stats: ReturnType<typeof computeStats>;
  isLoading: boolean;
}) {
  const avgMarginPercent = stats.avgMargin * 100;

  return (
    <section className="bg-secondary/60 border border-border/60 rounded-3xl p-6 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute -top-24 right-0 w-64 h-64 bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 left-0 w-72 h-72 bg-accent/10 blur-3xl" />
      </div>
      <div className="relative z-10 space-y-8">
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1 text-xs font-semibold text-primary w-fit bg-primary/10">
            <Sparkles className="w-4 h-4" />
            Craft smarter, profit faster
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Discover your best{" "}
              <span className="text-primary">crafts</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-3xl">
              Compare the cost of materials against what you can sell crafted
              items for. Find the most profitable crafts, analyze material
              requirements, and maximize your hideout efficiency.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            <>
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </>
          ) : (
            <>
              <StatsCard
                icon={TrendingUpIcon}
                label="Avg profit margin"
                value={
                  avgMarginPercent > 0
                    ? `${avgMarginPercent.toFixed(
                        avgMarginPercent >= 100 ? 0 : 1
                      )}%`
                    : "—"
                }
                helper="Across all craftable items"
              />
              <StatsCard
                icon={ArrowUpIcon}
                label="Profitable crafts"
                value={
                  stats.total > 0
                    ? `${stats.profitableCount}/${stats.total}`
                    : "0"
                }
                helper={
                  stats.total > 0
                    ? `${Math.round(stats.profitableShare)}% of craftable items`
                    : "No data indexed"
                }
              />
              <StatsCard
                icon={HammerIcon}
                label="Total potential profit"
                value={`${formatCredits(stats.totalPotentialProfit)}`}
                helper="If you craft every item once"
              />
              <StatsCard
                icon={ArrowUpRightIcon}
                label="Top profit"
                value={
                  stats.topProfitItem
                    ? `${formatCredits(stats.topProfit)}`
                    : "—"
                }
                helper={
                  stats.topProfitItem?.itemName
                    ? stats.topProfitItem.itemName
                    : "Awaiting data"
                }
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function CraftingCard({
  entry,
  index,
}: {
  entry: CraftingProfitEntry;
  index: number;
}) {
  const { data, isLoading } = useQuery(
    orpc.items.getItem.queryOptions({
      input: { id: entry.itemId },
    })
  );

  const materialCost = entry.materialCost ?? 0;
  const craftedValue = entry.craftedValue ?? 0;
  const profit = entry.profit ?? 0;
  const marginPct = (entry.profitMarginPct ?? 0) * 100;
  const isPositive = profit > 0;

  const craftBenches = entry.craftBench ?? [];

  return (
    <Card className="relative border-border/60 bg-card/80">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 w-full" style={{ width: '100%' }}>
          <div className="relative w-20 h-20 rounded-2xl bg-background border border-border/60 flex items-center justify-center overflow-hidden">
            {data?.imageFilename ? (
              <img
                src={data.imageFilename ?? undefined}
                alt={entry.itemName}
                className="w-full h-full object-contain p-3"
                loading="lazy"
              />
            ) : (
              <HammerIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <Link
                to="/items/$itemId"
                params={{ itemId: entry.itemId }}
                preload="intent"
                className="flex-1 min-w-0"
              >
                <CardTitle
                  className="text-2xl flex-1 min-w-0 truncate hover:text-primary transition-colors"
                  title={entry.itemName}
                >
                  {entry.itemName}
                </CardTitle>
              </Link>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isPositive
                    ? "bg-primary/10 text-primary border border-primary/40"
                    : "bg-destructive/10 text-destructive border border-destructive/40"
                }`}
              >
                {isPositive ? "Profitable" : "Loss risk"}
              </span>
            </div>
            <CardDescription className="mt-2">
              Material cost{" "}
              <span className="font-medium text-foreground">
                {formatCredits(materialCost)}
              </span>{" "}
              → Sells for{" "}
              <span className="font-medium text-primary">
                {formatCredits(craftedValue)}
              </span>
            </CardDescription>

            {craftBenches.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {craftBenches.map((bench) => (
                  <span
                    key={bench}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary border border-border/50 text-muted-foreground"
                  >
                    <WrenchIcon className="w-3 h-3" />
                    {bench}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Profit margin</span>
                <span className="font-semibold text-foreground">
                  {marginPct ? `${marginPct > 0 ? "+" : ""}${Math.round(marginPct)}%` : "—"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-border/60 overflow-hidden">
                <div
                  className={`h-full ${
                    isPositive ? "bg-primary" : "bg-destructive"
                  }`}
                  style={{
                    width: `${Math.min(Math.max(Math.abs(marginPct), 0), 200)}%`,
                  }}
                />
              </div>
              <div
                className={`text-sm font-semibold ${
                  isPositive ? "text-primary" : "text-destructive"
                }`}
              >
                {isPositive ? "+" : ""}
                {formatCredits(profit)} profit per craft
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <HammerIcon className="w-4 h-4 text-primary" />
            Required materials
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : data?.recipes && data.recipes.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {data.recipes.map((recipe) => {
              const materialValue = recipe.material?.value ?? 0;
              const totalMaterialValue = materialValue * recipe.quantity;
              return (
                <Link
                  key={`${recipe.itemId}-${recipe.materialId}`}
                  to="/items/$itemId"
                  params={{ itemId: recipe.materialId }}
                  preload="intent"
                  className="flex items-center gap-3 rounded-2xl border border-border/50 bg-background/50 p-3 hover:border-primary/60 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary/60 border border-border/40 flex items-center justify-center overflow-hidden">
                    {recipe.material?.imageFilename ? (
                      <img
                        src={recipe.material.imageFilename ?? undefined}
                        alt={recipe.material?.name ?? "Material"}
                        className="w-full h-full object-contain p-1.5"
                        loading="lazy"
                      />
                    ) : (
                      <ArchiveIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {recipe.material?.name ?? "Unknown material"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {recipe.quantity}x · {formatCredits(materialValue)} each
                    </p>
                  </div>
                  <div className="text-sm font-semibold tabular-nums">
                    {formatCredits(totalMaterialValue)}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            We do not have recipe data logged for this item yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatsCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/60 p-4 flex flex-col gap-4 shadow-sm">
      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{helper}</p>
      </div>
    </div>
  );
}

function EmptyState({
  hasSearch,
  hasFilter,
}: {
  hasSearch: boolean;
  hasFilter: boolean;
}) {
  return (
    <div className="border border-border/50 rounded-2xl bg-secondary/40 p-8 text-center space-y-3">
      <h3 className="text-2xl font-semibold">No craftable items found</h3>
      <p className="text-muted-foreground">
        {hasSearch
          ? "Try refining or clearing your search term."
          : hasFilter
            ? "All items are shown once you disable filters."
            : "We have not indexed any craftable items yet."}
      </p>
    </div>
  );
}

function computeStats(crafts: CraftingProfitEntry[]) {
  if (!crafts.length) {
    return {
      avgMargin: 0,
      profitableShare: 0,
      totalPotentialProfit: 0,
      profitableCount: 0,
      total: 0,
      topProfit: 0,
      topProfitItem: undefined as CraftingProfitEntry | undefined,
    };
  }

  const marginValues = crafts
    .map((entry) => entry.profitMarginPct)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value)
    );
  const avgMargin = marginValues.length
    ? marginValues.reduce((sum, value) => sum + value, 0) / marginValues.length
    : 0;
  const totalPotentialProfit = crafts.reduce(
    (sum, entry) => sum + Math.max(entry.profit ?? 0, 0),
    0
  );
  const profitableEntries = crafts.filter((entry) => (entry.profit ?? 0) > 0);
  const topProfitResult = crafts.reduce(
    (acc, entry) => {
      if (entry.profit === null || entry.profit === undefined) {
        return acc;
      }

      if (entry.profit > acc.topProfit) {
        return {
          topProfit: entry.profit,
          topProfitItem: entry,
        };
      }
      return acc;
    },
    {
      topProfit: Number.NEGATIVE_INFINITY,
      topProfitItem: undefined as CraftingProfitEntry | undefined,
    }
  );

  return {
    avgMargin,
    profitableShare: (profitableEntries.length / crafts.length) * 100,
    totalPotentialProfit,
    profitableCount: profitableEntries.length,
    total: crafts.length,
    topProfit:
      topProfitResult.topProfit === Number.NEGATIVE_INFINITY
        ? 0
        : topProfitResult.topProfit,
    topProfitItem: topProfitResult.topProfitItem,
  };
}

function sortEntries(
  a: CraftingProfitEntry,
  b: CraftingProfitEntry,
  sortBy: SortOption
) {
  switch (sortBy) {
    case "value":
      return (b.craftedValue ?? 0) - (a.craftedValue ?? 0);
    case "margin":
      return (
        (b.profitMarginPct ?? Number.NEGATIVE_INFINITY) -
        (a.profitMarginPct ?? Number.NEGATIVE_INFINITY)
      );
    case "name":
      return a.itemName.localeCompare(b.itemName);
    case "profit":
    default:
      return (b.profit ?? Number.NEGATIVE_INFINITY) - (a.profit ?? Number.NEGATIVE_INFINITY);
  }
}

function formatCredits(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return `${value.toLocaleString()} cr`;
}
