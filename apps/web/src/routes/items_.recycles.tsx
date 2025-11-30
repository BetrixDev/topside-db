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
  RecycleIcon,
  SearchIcon,
  Sparkles,
  TrendingUpIcon,
} from "lucide-react";
import { seo } from "@/lib/seo";

type RecycleValueQuery = ReturnType<
  typeof orpc.items.recycleValueList.queryOptions
>;
type RecycleValueEntry = Awaited<
  ReturnType<NonNullable<RecycleValueQuery["queryFn"]>>
>[number];

const sortOptions = [
  { label: "Highest yield", value: "yield" },
  { label: "Largest profit", value: "profit" },
  { label: "Recycled value", value: "value" },
  { label: "Name A → Z", value: "name" },
] as const;

type SortOption = (typeof sortOptions)[number]["value"];

export const Route = createFileRoute("/items_/recycles")({
  head: () => ({
    meta: [
      ...seo({
        title: "Recycles | Topside DB",
        description:
          "Compare original item values with what you gain by recycling them. Spot the standouts, dive into their output breakdowns, and plan your next dismantle Arc Raiders items with confidence.",
        keywords:
          "arc raiders, database, search engine, recycle, profit, salvage, arc raiders recycle list",
        image: "/og/images/recycles.png",
      }),
    ],
  }),
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(
      orpc.items.recycleValueList.queryOptions()
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("yield");
  const [showProfitableOnly, setShowProfitableOnly] = useState(true);
  const queryClient = useQueryClient();

  const {
    data: recycles = [],
    isLoading,
    isError,
  } = useQuery(orpc.items.recycleValueList.queryOptions());

  const stats = useMemo(() => computeStats(recycles), [recycles]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...recycles]
      .filter((entry) =>
        term ? entry.itemName.toLowerCase().includes(term) : true
      )
      .filter((entry) =>
        showProfitableOnly ? (entry.recycleYieldPct ?? 0) >= 1 : true
      )
      .sort((a, b) => sortEntries(a, b, sortBy));
  }, [recycles, search, showProfitableOnly, sortBy]);

  return (
    <div className="min-h-screen mt-16 md:px-0 px-4">
      <main className="max-w-7xl mx-auto py-8 space-y-10">
        <HeroSection stats={stats} isLoading={isLoading} />

        <section className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for an item to recycle..."
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
                    Unable to load recycle data right now. Please try again in a
                    moment.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    queryClient.invalidateQueries({
                      queryKey: orpc.items.recycleValueList.queryKey(),
                    })
                  }
                  className="text-destructive border-destructive/40"
                >
                  Retry
                </Button>
              </CardHeader>
            </Card>
          )}

          {isLoading && recycles.length === 0 ? (
            <Loader />
          ) : filtered.length === 0 ? (
            <EmptyState
              hasSearch={Boolean(search)}
              hasFilter={showProfitableOnly}
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filtered.map((entry, index) => (
                <RecycleCard
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
  const avgYieldPercent = stats.avgYield * 100;

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
            Recycle smarter, profit faster
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Visualize every <span className="text-primary">salvage</span>{" "}
              opportunity
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-3xl">
              Compare original item values with what you gain by recycling them.
              Spot the standouts, dive into their output breakdowns, and plan
              your next dismantle with confidence.
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
                label="Avg recycle yield"
                value={
                  avgYieldPercent > 0
                    ? `${avgYieldPercent.toFixed(
                        avgYieldPercent >= 150 ? 0 : 1
                      )}%`
                    : "—"
                }
                helper="Across all tracked items"
              />
              <StatsCard
                icon={ArrowUpIcon}
                label="Profitable items"
                value={
                  stats.total > 0
                    ? `${stats.profitableCount}/${stats.total}`
                    : "0"
                }
                helper={
                  stats.total > 0
                    ? `${Math.round(stats.profitableShare)}% of catalog`
                    : "No data indexed"
                }
              />
              <StatsCard
                icon={RecycleIcon}
                label="Total recycled value"
                value={`${formatCredits(stats.totalRecycledValue)}`}
                helper="If you dismantle every item once"
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

function RecycleCard({
  entry,
  index,
}: {
  entry: RecycleValueEntry;
  index: number;
}) {
  const { data, isLoading } = useQuery(
    orpc.items.getItem.queryOptions({
      input: { id: entry.itemId },
    })
  );

  const originalValue = entry.originalValue ?? 0;
  const recycledValue = entry.recycledValue ?? 0;
  const yieldPct = (entry.recycleYieldPct ?? 0) * 100;
  const profit = recycledValue - originalValue;
  const isPositive = profit >= 0;

  return (
    <Card className="relative border-border/60 bg-card/80">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="relative w-20 h-20 rounded-2xl bg-background border border-border/60 flex items-center justify-center overflow-hidden">
            {data?.imageFilename ? (
              <img
                src={data.imageFilename ?? undefined}
                alt={entry.itemName}
                className="w-full h-full object-contain p-3"
                loading="lazy"
              />
            ) : (
              <RecycleIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <CardTitle
                className="text-2xl flex-1 min-w-0 truncate"
                title={entry.itemName}
              >
                {entry.itemName}
              </CardTitle>
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
              Original value{" "}
              <span className="font-medium text-foreground">
                {formatCredits(originalValue)}
              </span>{" "}
              → Recycled haul{" "}
              <span className="font-medium text-primary">
                {formatCredits(recycledValue)}
              </span>
            </CardDescription>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Recycle yield</span>
                <span className="font-semibold text-foreground">
                  {yieldPct ? `${Math.round(yieldPct)}%` : "—"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-border/60 overflow-hidden">
                <div
                  className={`h-full ${
                    isPositive ? "bg-primary" : "bg-destructive"
                  }`}
                  style={{
                    width: `${Math.min(Math.max(yieldPct, 0), 250)}%`,
                  }}
                />
              </div>
              <div
                className={`text-sm font-semibold ${
                  isPositive ? "text-primary" : "text-destructive"
                }`}
              >
                {isPositive ? "+" : "-"}
                {formatCredits(Math.abs(profit))} compared to selling whole
              </div>
            </div>
          </div>

          <Link
            to="/items/$itemId"
            params={{ itemId: entry.itemId }}
            preload="intent"
            className="self-start"
          >
            <Button variant="ghost" size="sm" className="gap-1">
              Inspect
              <ArrowUpRightIcon className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <RecycleIcon className="w-4 h-4 text-primary" />
            Recycles into
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : data?.recycles && data.recycles.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {data.recycles.map((recycle) => {
              const materialValue = recycle.material?.value ?? 0;
              const totalMaterialValue = materialValue * recycle.quantity;
              return (
                <Link
                  key={`${recycle.itemId}-${recycle.materialId}`}
                  to="/items/$itemId"
                  params={{ itemId: recycle.materialId }}
                  preload="intent"
                  className="flex items-center gap-3 rounded-2xl border border-border/50 bg-background/50 p-3 hover:border-primary/60 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary/60 border border-border/40 flex items-center justify-center overflow-hidden">
                    {recycle.material?.imageFilename ? (
                      <img
                        src={recycle.material.imageFilename ?? undefined}
                        alt={recycle.material?.name ?? "Recycled material"}
                        className="w-full h-full object-contain p-1.5"
                        loading="lazy"
                      />
                    ) : (
                      <ArchiveIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {recycle.material?.name ?? "Unknown component"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {recycle.quantity}x · {formatCredits(materialValue)} each
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
            We do not have recycle outputs logged for this item yet.
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
      <h3 className="text-2xl font-semibold">No recycles found</h3>
      <p className="text-muted-foreground">
        {hasSearch
          ? "Try refining or clearing your search term."
          : hasFilter
          ? "All items are shown once you disable filters."
          : "We have not indexed any recycles yet."}
      </p>
    </div>
  );
}

function computeStats(recycles: RecycleValueEntry[]) {
  if (!recycles.length) {
    return {
      avgYield: 0,
      profitableShare: 0,
      totalRecycledValue: 0,
      profitableCount: 0,
      total: 0,
      topProfit: 0,
      topProfitItem: undefined as RecycleValueEntry | undefined,
    };
  }

  const yieldValues = recycles
    .map((entry) => entry.recycleYieldPct)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value)
    );
  const avgYield = yieldValues.length
    ? yieldValues.reduce((sum, value) => sum + value, 0) / yieldValues.length
    : 0;
  const totalRecycledValue = recycles.reduce(
    (sum, entry) => sum + (entry.recycledValue ?? 0),
    0
  );
  const profitableEntries = recycles.filter(
    (entry) => (entry.recycleYieldPct ?? 0) >= 1
  );
  const topProfitResult = recycles.reduce(
    (acc, entry) => {
      if (
        entry.recycleYieldPct === null ||
        entry.recycleYieldPct === undefined
      ) {
        return acc;
      }

      const profit = (entry.recycledValue ?? 0) - (entry.originalValue ?? 0);
      if (profit > acc.topProfit) {
        return {
          topProfit: profit,
          topProfitItem: entry,
        };
      }
      return acc;
    },
    {
      topProfit: Number.NEGATIVE_INFINITY,
      topProfitItem: undefined as RecycleValueEntry | undefined,
    }
  );

  return {
    avgYield,
    profitableShare: (profitableEntries.length / recycles.length) * 100,
    totalRecycledValue,
    profitableCount: profitableEntries.length,
    total: recycles.length,
    topProfit:
      topProfitResult.topProfit === Number.NEGATIVE_INFINITY
        ? 0
        : topProfitResult.topProfit,
    topProfitItem: topProfitResult.topProfitItem,
  };
}

function sortEntries(
  a: RecycleValueEntry,
  b: RecycleValueEntry,
  sortBy: SortOption
) {
  switch (sortBy) {
    case "value":
      return (b.recycledValue ?? 0) - (a.recycledValue ?? 0);
    case "profit":
      return (
        (b.recycledValue ?? 0) -
        (b.originalValue ?? 0) -
        ((a.recycledValue ?? 0) - (a.originalValue ?? 0))
      );
    case "name":
      return a.itemName.localeCompare(b.itemName);
    case "yield":
    default:
      return (
        (b.recycleYieldPct ?? Number.NEGATIVE_INFINITY) -
        (a.recycleYieldPct ?? Number.NEGATIVE_INFINITY)
      );
  }
}

function formatCredits(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return `${value.toLocaleString()} cr`;
}
