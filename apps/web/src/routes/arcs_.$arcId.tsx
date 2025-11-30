import {
  SectionCard,
  ItemCard,
  ItemCardGrid,
} from "@/components/resource-cards";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HeartIcon,
  ShieldIcon,
  AlertTriangleIcon,
  SwordsIcon,
  CrosshairIcon,
  PackageIcon,
  ExternalLinkIcon,
  SkullIcon,
  ZapIcon,
  FlameIcon,
  SnowflakeIcon,
  SparklesIcon,
  BombIcon,
  TargetIcon,
  BrainIcon,
} from "lucide-react";
import { startCase } from "es-toolkit/string";
import { usePageView } from "@/lib/hooks/use-page-view";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Get icon for attack type
function getAttackTypeIcon(type: string) {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes("electric") || normalizedType.includes("shock"))
    return ZapIcon;
  if (normalizedType.includes("fire") || normalizedType.includes("burn"))
    return FlameIcon;
  if (normalizedType.includes("ice") || normalizedType.includes("cold"))
    return SnowflakeIcon;
  if (normalizedType.includes("explosive") || normalizedType.includes("blast"))
    return BombIcon;
  if (normalizedType.includes("melee") || normalizedType.includes("physical"))
    return SwordsIcon;
  return CrosshairIcon;
}

// Get color class for threat level
function getThreatLevelStyle(threatLevel: string | null | undefined) {
  if (!threatLevel) return { color: "text-muted-foreground", bg: "bg-muted" };
  const level = threatLevel.toLowerCase();
  if (level.includes("extreme") || level.includes("very high"))
    return { color: "text-red-500", bg: "bg-red-500/10 border-red-500/30" };
  if (level.includes("high"))
    return {
      color: "text-orange-500",
      bg: "bg-orange-500/10 border-orange-500/30",
    };
  if (level.includes("medium") || level.includes("moderate"))
    return {
      color: "text-yellow-500",
      bg: "bg-yellow-500/10 border-yellow-500/30",
    };
  if (level.includes("low"))
    return {
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/30",
    };
  return { color: "text-muted-foreground", bg: "bg-muted" };
}

// Get color for rarity badge
function getRarityColor(rarity: string | null | undefined) {
  if (!rarity) return "bg-muted text-muted-foreground";
  const r = rarity.toLowerCase();
  if (r === "legendary" || r === "exotic")
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  if (r === "epic" || r === "rare")
    return "bg-purple-500/20 text-purple-400 border-purple-500/30";
  if (r === "uncommon")
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
}

export const Route = createFileRoute("/arcs_/$arcId")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    return await context.queryClient.ensureQueryData(
      orpc.arcs.getArc.queryOptions({
        input: { id: params.arcId },
      })
    );
  },
  head: ({ loaderData }) => ({
    meta: [
      ...seo({
        title: `${loaderData?.name ?? "Unknown"} | Topside DB`,
        description: `View detailed information about the Arc ${
          loaderData?.name ?? "Unknown"
        } in Arc Raiders. See health, attacks, weaknesses, and loot drops.`,
        keywords: `arc raiders, database, search engine, arc, enemy, ${
          loaderData?.name ?? "Unknown"
        }, ${loaderData?.threatLevel ?? ""}`,
        image: loaderData?.imageUrl ?? undefined,
      }),
    ],
  }),
});

function RouteComponent() {
  const params = Route.useParams();

  const { data } = useQuery(
    orpc.arcs.getArc.queryOptions({
      input: { id: params.arcId },
    })
  );

  usePageView("arc", params.arcId, !!data);

  const threatStyle = getThreatLevelStyle(data?.threatLevel);
  const attackTypes = Object.keys(data?.attacksByType ?? {});
  const lootWithItems = data?.lootDetails?.filter((l) => l.item !== null) ?? [];

  return (
    <div className="min-h-screen md:px-0 px-4">
      <main className="max-w-7xl mx-auto py-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Arc Display */}
          <div className="lg:col-span-1">
            <div className="bg-secondary rounded-lg border border-border/50 p-6 sticky top-20">
              {/* Arc Image */}
              <div className="relative aspect-square bg-linear-to-br from-accent/10 to-background rounded-lg border border-border/50 overflow-hidden mb-4 flex items-center justify-center group">
                <div className="absolute inset-0 bg-linear-to-br from-red-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {data?.imageUrl ? (
                  <img
                    src={data.imageUrl}
                    alt={data?.name ?? "Arc"}
                    className="w-full h-full object-cover z-10"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    <SkullIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Threat Level Badge */}
              {data?.threatLevel && (
                <div
                  className={cn(
                    "flex items-center justify-center gap-2 py-2 px-4 rounded-lg border mb-4",
                    threatStyle.bg
                  )}
                >
                  <AlertTriangleIcon
                    className={cn("w-4 h-4", threatStyle.color)}
                  />
                  <span className={cn("font-semibold", threatStyle.color)}>
                    {data.threatLevel} Threat
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <HeartIcon className="w-4 h-4" />
                    Health
                  </span>
                  <span className="font-medium">
                    {data?.health?.toLocaleString() ?? "Unknown"}
                  </span>
                </div>
                {data?.armorPlating && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <ShieldIcon className="w-4 h-4" />
                      Armor Plating
                    </span>
                    <span className="font-medium">{data.armorPlating}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <SwordsIcon className="w-4 h-4" />
                    Attacks
                  </span>
                  <span className="font-medium">
                    {data?.stats?.totalAttacks ?? 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <TargetIcon className="w-4 h-4" />
                    Weaknesses
                  </span>
                  <span className="font-medium">
                    {data?.stats?.totalWeaknesses ?? 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <PackageIcon className="w-4 h-4" />
                    Loot Items
                  </span>
                  <span className="font-medium">
                    {data?.stats?.totalLoot ?? 0}
                  </span>
                </div>
                {data?.totalLootValue != null && data.totalLootValue > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <SparklesIcon className="w-4 h-4" />
                      Potential Value
                    </span>
                    <span className="font-medium text-primary">
                      {data.totalLootValue.toLocaleString()} cr
                    </span>
                  </div>
                )}
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

          {/* Right Column - Arc Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Description */}
            <div>
              <h1 className="text-4xl font-bold mb-3 text-balance">
                {data?.name ?? "Unknown Arc"}
              </h1>

              {/* Tags Row */}
              <div className="flex flex-wrap gap-2 mb-4">
                {data?.threatLevel && (
                  <span
                    className={cn(
                      "px-3 py-1 text-xs font-semibold rounded-full border",
                      threatStyle.bg,
                      threatStyle.color
                    )}
                  >
                    {data.threatLevel}
                  </span>
                )}
                {data?.armorPlating && (
                  <span className="px-3 py-1 bg-slate-500/10 text-slate-400 text-xs font-semibold rounded-full border border-slate-500/30 flex items-center gap-1">
                    <ShieldIcon className="w-3 h-3" />
                    {data.armorPlating}
                  </span>
                )}
                {attackTypes.length > 0 &&
                  attackTypes.slice(0, 3).map((type) => (
                    <span
                      key={type}
                      className="px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full flex items-center gap-1"
                    >
                      {startCase(type)}
                    </span>
                  ))}
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {data?.description ?? "No description available"}
              </p>
            </div>

            {/* Weaknesses Section */}
            {data?.weaknesses && data.weaknesses.length > 0 && (
              <SectionCard icon={TargetIcon} title="Weaknesses">
                <p className="text-sm text-muted-foreground mb-3">
                  {data.name} has weaknesses you should be aware of:
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.weaknesses.map((weakness, index) => (
                    <Tooltip>
                      <TooltipTrigger>
                        <span
                          key={index}
                          className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                          {weakness.type === "armor" ? (
                            <CrosshairIcon className="w-4 h-4" />
                          ) : (
                            <BrainIcon className="w-4 h-4" />
                          )}
                          {weakness.name}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{weakness.description}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Attacks Section */}
            {attackTypes.length > 0 && (
              <SectionCard icon={SwordsIcon} title="Attack Patterns">
                <p className="text-sm text-muted-foreground mb-4">
                  Be prepared for these attacks:
                </p>
                <div className="space-y-4">
                  {attackTypes.map((type) => {
                    const AttackIcon = getAttackTypeIcon(type);
                    const attacks = data?.attacksByType?.[type] ?? [];
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <AttackIcon className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold text-sm">
                            {startCase(type)}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            ({attacks.length}{" "}
                            {attacks.length === 1 ? "attack" : "attacks"})
                          </span>
                        </div>
                        <div className="pl-6 space-y-1">
                          {attacks.map((description, index) => (
                            <p
                              key={index}
                              className="text-sm text-muted-foreground leading-relaxed"
                            >
                              • {description}
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {/* Loot Section */}
            {data?.lootDetails && data.lootDetails.length > 0 && (
              <SectionCard icon={PackageIcon} title="Potential Loot">
                {/* Rarity breakdown */}
                {data.lootRarities && data.lootRarities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {data.lootRarities.map((rarity) => (
                      <span
                        key={rarity}
                        className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded border",
                          getRarityColor(rarity)
                        )}
                      >
                        {startCase(rarity)}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-sm text-muted-foreground mb-3">
                  Items that can drop from this arc:
                </p>

                {/* Show linked items first */}
                {lootWithItems.length > 0 && (
                  <ItemCardGrid className="mb-4">
                    {lootWithItems.map((loot, index) => (
                      <ItemCard
                        key={`${loot.item!.id}-${index}`}
                        itemId={loot.item!.id}
                        name={loot.item!.name}
                        imageUrl={loot.item!.imageFilename}
                        subtitle={
                          loot.item!.rarity
                            ? startCase(loot.item!.rarity)
                            : undefined
                        }
                      />
                    ))}
                  </ItemCardGrid>
                )}

                {/* Show unlinked loot names */}
                {data.lootDetails.filter((l) => l.item === null).length > 0 && (
                  <div className="space-y-2">
                    {lootWithItems.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Other potential drops:
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {data.lootDetails
                        .filter((l) => l.item === null)
                        .map((loot, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm"
                          >
                            {loot.name}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </SectionCard>
            )}

            {/* Empty State */}
            {!data?.weaknesses?.length &&
              !attackTypes.length &&
              !data?.lootDetails?.length && (
                <div className="text-center py-12 text-muted-foreground">
                  <SkullIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No detailed information available for this arc.</p>
                </div>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}
