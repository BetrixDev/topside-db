import { FlickeringGrid } from "@/components/ui/shadcn-io/flickering-grid";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircleIcon,
  ArchiveIcon,
  ChevronLeftIcon,
  HammerIcon,
  LightbulbIcon,
  RecycleIcon,
} from "lucide-react";

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
                <FlickeringGrid
                  className="z-0 absolute inset-0 size-full"
                  squareSize={8}
                  gridGap={10}
                  color="#6B7280"
                  maxOpacity={0.3}
                  flickerChance={0.1}
                />
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
                  <span className="font-medium">5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight</span>
                  <span className="font-medium">0.2 kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Value</span>
                  <span className="font-medium">300</span>
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
            <div className="bg-secondary rounded-lg border border-border/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <LightbulbIcon className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Effects</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2  border-b border-border">
                  <span>Stamina Regeneration</span>
                  <span className="text-muted-foreground">5/s</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span>Duration</span>
                  <span className="text-muted-foreground">10s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Use Time</span>
                  <span className="text-muted-foreground">1s</span>
                </div>
              </div>
            </div>

            {/* Crafting Recipe Section */}
            <div className="bg-secondary rounded-lg border border-border/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <HammerIcon className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Crafting Recipe</h2>
              </div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Craft Bench:
                </p>
                <p className="font-medium text-foreground">Medical Lab</p>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Required Materials:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Chemicals", qty: "3x" },
                  { name: "Plastic Parts", qty: "2x" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="bg-background/50 rounded-lg p-3 border border-border/30 hover:border-accent/50 transition-colors cursor-pointer group"
                  >
                    <div className="w-full aspect-square bg-linear-to-br from-accent/5 to-background rounded mb-2 flex items-center justify-center overflow-hidden">
                      <img
                        src={data?.imageFilename ?? undefined}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.qty}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recycles Into */}
            <div className="bg-secondary rounded-lg border border-border/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <RecycleIcon className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Recycles Into</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                When recycling, you will receive{" "}
                <span className="text-foreground font-semibold">100</span> less
                Raider Coins
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Chemicals", qty: "1x" },
                  { name: "Plastic Parts", qty: "1x" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="bg-background/50 rounded-lg p-3 border border-border/30"
                  >
                    <div className="w-full aspect-square bg-linear-to-br from-accent/5 to-background rounded mb-2 flex items-center justify-center overflow-hidden">
                      <img
                        src={data?.imageFilename ?? undefined}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.qty}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Quests */}
            <div className="bg-secondary rounded-lg border border-border/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircleIcon className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Related Quests</h2>
              </div>
              <div className="space-y-3">
                {[
                  {
                    name: "Doctor's Orders",
                    faction: "Trader Octavio",
                    reward: "x3",
                  },
                  { name: "Espresso", faction: "Trader Apollo", reward: "x3" },
                  {
                    name: "Trash Into Treasure",
                    faction: "Trader Stan",
                    reward: "x3",
                  },
                ].map((quest) => (
                  <div
                    key={quest.name}
                    className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30 hover:border-accent/50 transition-colors cursor-pointer group"
                  >
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {quest.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {quest.faction}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                      Reward: {quest.reward}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
