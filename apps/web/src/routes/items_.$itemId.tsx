import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  SectionCard,
  ItemCard,
  ItemCardGrid,
  QuestCard,
  HideoutCard,
  TraderCard,
} from "@/components/resource-cards";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  HammerIcon,
  LightbulbIcon,
  RecycleIcon,
  UsersIcon,
  ScissorsIcon,
  GiftIcon,
  BuildingIcon,
} from "lucide-react";
import { startCase } from "es-toolkit/string";
import { usePageView } from "@/lib/hooks/use-page-view";

export const Route = createFileRoute("/items_/$itemId")({
  component: RouteComponent,
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      orpc.items.getItem.queryOptions({
        input: { id: params.itemId },
      })
    );
  },
});

function RouteComponent() {
  const params = Route.useParams();

  const { data } = useQuery(
    orpc.items.getItem.queryOptions({
      input: { id: params.itemId },
    })
  );

  usePageView("item", params.itemId, !!data);

  const traders =
    data?.traders
      ?.slice()
      .sort((a, b) =>
        (a.trader?.name ?? a.traderId).localeCompare(
          b.trader?.name ?? b.traderId
        )
      ) ?? [];

  const hideoutRequirements = data?.hideoutRequirements ?? [];
  const questRewards = data?.questsRewards ?? [];

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Item Display */}
          <div className="lg:col-span-1">
            <div className="bg-secondary rounded-lg border border-border/50 p-6 sticky top-20">
              <div className="relative aspect-square bg-linear-to-br from-accent/10 to-background rounded-lg border border-border/50 overflow-hidden mb-4 flex items-center justify-center group">
                <div className="absolute inset-0 bg-linear-to-br from-accent/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <img
                  src={data?.imageFilename ?? undefined}
                  alt={data?.name ?? "Item icon"}
                  width={300}
                  height={300}
                  className="w-full h-full object-contain p-4 z-10"
                />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stack Size</span>
                  <span className="font-medium">
                    {data?.stackSize ?? "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight</span>
                  <span className="font-medium">
                    {data?.weightKg != null ? `${data.weightKg} kg` : `N/A`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Value</span>
                  <span className="font-medium">
                    {data?.value != null
                      ? `${data.value.toLocaleString()} credits`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Item Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Tags */}
            <div>
              <h1 className="text-4xl font-bold mb-3 text-balance">
                {data?.name ?? "Unknown"}
              </h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
                  {data?.type ?? "Unknown"}
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/30">
                  {data?.rarity ?? "Unknown"}
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {data?.description ?? "No description available"}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Last updated: {data?.updatedAt ?? "Unknown"}
              </p>
            </div>

            {/* Effects Section */}
            {data?.effects && data.effects.length > 0 && (
              <SectionCard icon={LightbulbIcon} title="Effects">
                <div className="space-y-3">
                  {data.effects.map((effect, index) => (
                    <div
                      key={effect.name}
                      className={`flex justify-between items-center ${
                        index < (data?.effects?.length ?? 0) - 1
                          ? "pb-2 border-b border-border"
                          : ""
                      }`}
                    >
                      <span>{effect.name}</span>
                      <span className="text-muted-foreground">
                        {effect.value}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Crafting Recipe Section */}
            {(data?.craftBench ||
              (data?.recipes && data.recipes.length > 0)) && (
              <SectionCard icon={HammerIcon} title="Crafting Recipe">
                {data.craftBench && data.craftBench.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Craft Bench:
                    </p>
                    <p className="font-medium text-foreground">
                      {startCase(data.craftBench.join(", "))}
                    </p>
                  </div>
                )}
                {data.recipes && data.recipes.length > 0 && (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">
                      Required Materials:
                    </p>
                    <ItemCardGrid>
                      {data.recipes.map((recipe) => (
                        <ItemCard
                          key={recipe.id}
                          itemId={recipe.materialId}
                          name={recipe.material?.name}
                          imageUrl={recipe.material?.imageFilename}
                          quantity={recipe.quantity}
                        />
                      ))}
                    </ItemCardGrid>
                  </>
                )}
              </SectionCard>
            )}

            {/* Recycles Into */}
            {data?.recycles && data.recycles.length > 0 && (
              <SectionCard icon={RecycleIcon} title="Recycles Into">
                <Alert className="mb-4" variant="default">
                  {!data.isRecycleWorthIt && (
                    <AlertTriangleIcon className="w-4 h-4" color="yellow" />
                  )}
                  {data.isRecycleWorthIt && (
                    <CheckCircleIcon className="w-4 h-4" color="green" />
                  )}
                  <AlertTitle>
                    {data.isRecycleWorthIt
                      ? "Recycling is worth it"
                      : "Recycling is not worth it"}
                  </AlertTitle>
                  <AlertDescription className="block">
                    Selling all recycled items would yield{" "}
                    <span className="text-primary font-medium">
                      {data.recycledValue.toLocaleString()} credits
                    </span>
                    , compared to{" "}
                    <span className="text-primary font-medium">
                      {data.value?.toLocaleString() ?? "N/A"} credits
                    </span>{" "}
                    for the original item.
                  </AlertDescription>
                </Alert>
                <ItemCardGrid>
                  {data.recycles.map((recycle) => (
                    <ItemCard
                      key={recycle.id}
                      itemId={recycle.materialId}
                      name={recycle.material?.name}
                      imageUrl={recycle.material?.imageFilename}
                      quantity={recycle.quantity}
                    />
                  ))}
                </ItemCardGrid>
              </SectionCard>
            )}

            {/* Salvages Into */}
            {data?.salvages && data.salvages.length > 0 && (
              <SectionCard icon={ScissorsIcon} title="Recycles Into">
                <ItemCardGrid>
                  {data.salvages.map((salvage) => (
                    <ItemCard
                      key={salvage.id}
                      itemId={salvage.materialId}
                      name={salvage.material?.name}
                      imageUrl={salvage.material?.imageFilename}
                      quantity={salvage.quantity}
                    />
                  ))}
                </ItemCardGrid>
              </SectionCard>
            )}

            {/* Hideout Requirements */}
            {hideoutRequirements.length > 0 && (
              <SectionCard icon={BuildingIcon} title="Hideout Upgrades">
                <p className="text-sm text-muted-foreground mb-3">
                  This item is required for the following hideout upgrades:
                </p>
                <div className="flex flex-col gap-2">
                  {hideoutRequirements.map((req, index) => (
                    <HideoutCard
                      key={`${req.hideout?.id}-${req.level}-${index}`}
                      hideoutId={req.hideout?.id ?? ""}
                      name={req.hideout?.name}
                      level={req.level}
                      quantity={req.quantity}
                    />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Quest Rewards */}
            {questRewards.length > 0 && (
              <SectionCard icon={GiftIcon} title="Quest Rewards">
                <p className="text-sm text-muted-foreground mb-3">
                  This item can be obtained as a reward from:
                </p>
                <div className="flex flex-col gap-2">
                  {questRewards.map((reward, index) => (
                    <QuestCard
                      key={`${reward.quest?.id}-${index}`}
                      questId={reward.quest?.id ?? ""}
                      name={reward.quest?.name}
                      quantity={reward.quantity}
                      variant="reward"
                    />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Traders */}
            {traders.length > 0 && (
              <SectionCard icon={UsersIcon} title="Traders">
                <p className="text-sm text-muted-foreground mb-3">
                  Purchase this item from the following traders:
                </p>
                <div className="flex flex-col gap-3">
                  {traders.map((trader) => {
                    const traderInfo = trader.trader;
                    const quantityPerSale = Math.max(
                      trader.quantityPerSale ?? 1,
                      1
                    );
                    const traderRecord = trader as Record<string, unknown>;
                    const rawPrice =
                      typeof traderRecord.pricePerSale === "number"
                        ? (traderRecord.pricePerSale as number)
                        : typeof traderRecord.salePrice === "number"
                        ? (traderRecord.salePrice as number)
                        : typeof traderRecord.itemPrice === "number"
                        ? (traderRecord.itemPrice as number)
                        : typeof traderRecord.price === "number"
                        ? (traderRecord.price as number)
                        : null;
                    const fallbackPrice =
                      rawPrice == null &&
                      trader.currency === "credits" &&
                      data?.value != null
                        ? data.value * quantityPerSale
                        : null;
                    const salePrice = rawPrice ?? fallbackPrice;

                    return (
                      <TraderCard
                        key={trader.traderId}
                        traderId={trader.traderId}
                        name={traderInfo?.name}
                        imageUrl={traderInfo?.imageUrl}
                        price={salePrice}
                        currency={trader.currency}
                        quantityPerSale={quantityPerSale}
                      />
                    );
                  })}
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
