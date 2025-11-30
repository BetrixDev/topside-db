import { ExternalLink, HardHat, Wrench, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UnderConstruction() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-amber-950/20 via-background to-orange-950/10">
      {/* Animated caution tape strips */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top left diagonal strip */}
        <div
          className="absolute -left-20 top-16 h-8 w-[200%] -rotate-12 animate-pulse"
          style={{
            background:
              "repeating-linear-gradient(90deg, #000 0px, #000 20px, #f59e0b 20px, #f59e0b 40px)",
          }}
        />
        {/* Top right diagonal strip */}
        <div
          className="absolute -right-20 top-32 h-8 w-[200%] rotate-12 opacity-80"
          style={{
            background:
              "repeating-linear-gradient(90deg, #f59e0b 0px, #f59e0b 20px, #000 20px, #000 40px)",
          }}
        />
        {/* Bottom left diagonal strip */}
        <div
          className="absolute -left-20 bottom-32 h-8 w-[200%] rotate-12 opacity-80"
          style={{
            background:
              "repeating-linear-gradient(90deg, #000 0px, #000 20px, #f59e0b 20px, #f59e0b 40px)",
          }}
        />
        {/* Bottom right diagonal strip */}
        <div
          className="absolute -right-20 bottom-16 h-8 w-[200%] -rotate-12 animate-pulse"
          style={{
            background:
              "repeating-linear-gradient(90deg, #f59e0b 0px, #f59e0b 20px, #000 20px, #000 40px)",
          }}
        />
      </div>

      {/* Floating construction elements */}
      <div className="pointer-events-none absolute inset-0">
        <Wrench
          className="absolute left-[10%] top-[20%] size-8 rotate-45 text-amber-500/20 animate-bounce"
          style={{ animationDelay: "0.5s", animationDuration: "3s" }}
        />
        <AlertTriangle
          className="absolute right-[15%] top-[30%] size-10 text-orange-500/20 animate-bounce"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        />
        <HardHat
          className="absolute left-[20%] bottom-[25%] size-12 text-yellow-500/20 animate-bounce"
          style={{ animationDelay: "1.5s", animationDuration: "3.5s" }}
        />
        <Wrench
          className="absolute right-[10%] bottom-[20%] size-6 -rotate-45 text-amber-500/20 animate-bounce"
          style={{ animationDelay: "2s", animationDuration: "2.5s" }}
        />
      </div>

      {/* Main content card */}
      <div className="relative z-10 mx-4 max-w-lg">
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/30 bg-card/95 p-8 shadow-2xl backdrop-blur-sm">
          {/* Top hazard bar */}
          <div
            className="absolute inset-x-0 top-0 h-2"
            style={{
              background:
                "repeating-linear-gradient(90deg, #000 0px, #000 8px, #f59e0b 8px, #f59e0b 16px)",
            }}
          />

          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-amber-500/20" />
              <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
                <HardHat className="size-10 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-3 text-center font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            <span className="text-amber-500">[</span>
            PAGE UNDER CONSTRUCTION
            <span className="text-amber-500">]</span>
          </h1>

          {/* Subtitle */}
          <p className="mb-6 text-center text-muted-foreground">
            Our Raiders are working hard to bring you this content.
            <br />
            Check back soon!
          </p>

          {/* Divider */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
            <AlertTriangle className="size-4 text-amber-500" />
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          </div>

          {/* Wiki link */}
          <p className="mb-4 text-center text-sm text-muted-foreground">
            In the meantime, visit the community wiki for more information:
          </p>

          <div className="flex justify-center">
            <Button
              asChild
              variant="outline"
              className="group border-amber-500/50 bg-amber-500/10 text-amber-600 hover:border-amber-500 hover:bg-amber-500/20 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
            >
              <a
                href="https://arcraiders.wiki"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="font-mono font-semibold">arcraiders.wiki</span>
                <ExternalLink className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </Button>
          </div>

          {/* Bottom hazard bar */}
          <div
            className="absolute inset-x-0 bottom-0 h-2"
            style={{
              background:
                "repeating-linear-gradient(90deg, #f59e0b 0px, #f59e0b 8px, #000 8px, #000 16px)",
            }}
          />
        </div>

        {/* Shadow glow */}
        <div className="absolute -inset-4 -z-10 rounded-3xl bg-amber-500/5 blur-2xl" />
      </div>
    </div>
  );
}
