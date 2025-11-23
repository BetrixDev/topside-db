import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangleIcon,
  ArchiveIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  HammerIcon,
  LightbulbIcon,
  RecycleIcon,
} from "lucide-react";
import { startCase } from "es-toolkit/string";

export const Route = createFileRoute("/item/$itemId")({
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/">
              <button className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArchiveIcon className="w-4 h-4" />
              <span>Item: {data?.name ?? "Unknown"}</span>
            </div>
          </div>
          <Link to="/">
            <div className="text-xs text-muted-foreground">Topside DB</div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
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
                    {data?.weightKg != null ? `${data.weightKg} kg` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Value</span>
                  <span className="font-medium">{data?.value ?? "N/A"}</span>
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
              <div className="flex gap-2 mb-4">
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
              <div className="bg-secondary rounded-lg border border-border/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <LightbulbIcon className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Effects</h2>
                </div>
                <div className="space-y-3">
                  {data.effects.map((effect, index) => (
                    <div
                      key={effect.id}
                      className={`flex justify-between items-center ${
                        index < data.effects.length - 1
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
              </div>
            )}

            {/* Crafting Recipe Section */}
            {(data?.craftBench ||
              (data?.recipes && data.recipes.length > 0)) && (
              <div className="bg-secondary rounded-lg border border-border/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <HammerIcon className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Crafting Recipe</h2>
                </div>
                {data.craftBench && (
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
                    <div className="flex flex-col gap-2">
                      {data.recipes.map((recipe) => (
                        <Link
                          key={recipe.id}
                          to="/item/$itemId"
                          params={{ itemId: recipe.materialId }}
                          className="flex bg-card hover:bg-background rounded-lg border border-border hover:border-primary/50 transition-colors p-2 gap-2"
                        >
                          <img
                            src={recipe.material?.imageFilename ?? undefined}
                            alt={recipe.material?.name ?? "Material"}
                            className="w-12 h-12 object-contain"
                          />
                          <div className="flex flex-col gap-1 justify-center">
                            <p className="text-xs font-medium truncate">
                              {recipe.material?.name ?? recipe.materialId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {recipe.quantity}x
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Recycles Into */}
            {data?.recycles && data.recycles.length > 0 && (
              <div className="bg-secondary rounded-lg border border-border/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <RecycleIcon className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Recycles Into</h2>
                </div>
                <Alert className="mb-2" variant="default">
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
                  <AlertDescription>
                    <div>
                      {" "}
                      Selling all recyced items would yield{" "}
                      <span className="text-primary">
                        {data.recycledValue} credits
                      </span>
                      , compared to{" "}
                      <span className="text-primary">{data.value} credits</span>{" "}
                      for the original item.
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="flex flex-col gap-2">
                  {data.recycles.map((recycle) => (
                    <Link
                      key={recycle.id}
                      to="/item/$itemId"
                      params={{ itemId: recycle.materialId }}
                      className="flex bg-card hover:bg-background rounded-lg border border-border hover:border-primary/50 transition-colors p-2 gap-2"
                    >
                      <div className="">
                        <img
                          src={recycle.material?.imageFilename ?? undefined}
                          alt={recycle.material?.name ?? "Material"}
                          className="w-12 h-12 object-contain"
                        />
                      </div>
                      <div className="flex flex-col gap-1 justify-center">
                        <p className="text-xs font-medium truncate">
                          {recycle.material?.name ?? recycle.materialId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {recycle.quantity}x
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16 py-6 px-4 text-center text-xs text-muted-foreground">
        <p className="mb-2">
          Game content and materials are trademarks and copyrights of Embark
          Studios and its licensors. All rights reserved.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <span>•</span>
          <Link
            to="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
