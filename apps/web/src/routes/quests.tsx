import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SearchIcon,
  ScrollTextIcon,
  SparklesIcon,
  ArrowRightIcon,
  UserIcon,
} from "lucide-react";
import type { QuestSearchHit } from "@topside-db/schemas";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { seo } from "@/lib/seo";

const questsSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/quests")({
  component: QuestsPage,
  validateSearch: zodValidator(questsSearchSchema),
  loaderDeps: ({ search: { q } }) => ({ q }),
  loader: ({ context, deps: { q } }) => {
    context.queryClient.ensureQueryData(
      orpc.search.search.queryOptions({
        input: {
          query: q,
          category: "quests",
          limit: 50,
        },
        staleTime: 1000 * 60 * 15,
      })
    );
  },
  head: () => ({
    meta: [
      ...seo({
        title: "Quests | Topside DB",
        description:
          "Browse all quests in Arc Raiders. Find missions, objectives, rewards, and trader assignments.",
        keywords:
          "arc raiders, database, quests, missions, objectives, rewards, traders",
      }),
    ],
  }),
});

function QuestsPage() {
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
        category: "quests",
        limit: 50,
      },
      staleTime: 1000 * 60 * 15,
    })
  );

  const quests = (data?.hits ?? []) as QuestSearchHit[];
  const hasSearched = q.length > 0;

  return (
    <main className="min-h-screen relative overflow-hidden pt-20 pb-12">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <FlickeringGrid
          className="z-0 absolute inset-0 size-full"
          squareSize={6}
          gridGap={12}
          color="#10B981"
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
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center">
              <ScrollTextIcon className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Quests</h1>
              <p className="text-muted-foreground text-sm">
                Get basic information about quests
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative mt-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon
                className={cn(
                  "w-5 h-5 transition-colors duration-200",
                  inputValue ? "text-emerald-500" : "text-muted-foreground"
                )}
              />
            </div>
            <Input
              type="text"
              placeholder="Search for quests..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full h-14 pl-12 pr-4 text-lg rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm shadow-lg focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 transition-all placeholder:text-muted-foreground/60"
            />
            {isFetching && hasSearched && (
              <div className="absolute inset-y-0 right-4 flex items-center">
                <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </header>

        {/* Results Section */}
        <section>
          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/5">
                <SparklesIcon className="w-10 h-10 text-emerald-500/70" />
              </div>
              <h2 className="text-xl font-semibold text-foreground/80 mb-2">
                Find Your Mission
              </h2>
              <p className="text-muted-foreground max-w-md leading-relaxed">
                Search through all available quests. Find missions by name or
                filter by the trader who assigns them.
              </p>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <QuestCardSkeleton key={i} delay={i * 50} />
              ))}
            </div>
          ) : quests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-3xl bg-muted/50 border border-border flex items-center justify-center mb-6">
                <SearchIcon className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h2 className="text-xl font-semibold text-foreground/80 mb-2">
                No Quests Found
              </h2>
              <p className="text-muted-foreground max-w-md">
                We couldn't find any quests matching "{q}". Try adjusting your
                search terms.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {quests.length}
                  </span>{" "}
                  quest{quests.length !== 1 ? "s" : ""} found
                  {typeof data?.processingTimeMs === "number" && (
                    <span className="ml-2 font-mono text-xs text-muted-foreground/70">
                      ({data.processingTimeMs}ms)
                    </span>
                  )}
                </p>
              </div>
              <div className="space-y-2">
                {quests.map((quest, index) => (
                  <QuestCard key={quest.id} quest={quest} index={index} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function QuestCard({ quest, index }: { quest: QuestSearchHit; index: number }) {
  return (
    <Link
      to="/quests/$questId"
      params={{ questId: quest.id }}
      className="group block"
      style={{
        animationDelay: `${index * 30}ms`,
      }}
    >
      <div
        className={cn(
          "relative flex items-center gap-4 p-4 rounded-2xl",
          "bg-card/60 backdrop-blur-sm border border-border/40",
          "hover:bg-card/90 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5",
          "transition-all duration-300 ease-out",
          "animate-in fade-in slide-in-from-bottom-2"
        )}
      >
        {/* Quest Icon */}
        <div className="relative w-16 h-16 rounded-xl bg-linear-to-br from-background to-muted/50 border border-border/30 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-emerald-500/30 transition-colors">
          <ScrollTextIcon className="w-7 h-7 text-muted-foreground/50 group-hover:text-emerald-500/70 transition-colors" />
        </div>

        {/* Quest Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-emerald-500 transition-colors truncate">
            {quest.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <UserIcon className="w-3 h-3" />
              {quest.trader}
            </span>
            <span className="text-xs text-muted-foreground font-mono truncate">
              ID: {quest.id}
            </span>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="shrink-0 w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5">
          <ArrowRightIcon className="w-4 h-4 text-emerald-500" />
        </div>
      </div>
    </Link>
  );
}

function QuestCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-2xl bg-card/40 border border-border/20"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}
