import {
  Home,
  Search,
  Radar,
  Signal,
  SignalZero,
  MapPinOff,
  Compass,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-linear-to-br from-primary/10 via-background to-destructive/5">
      {/* Animated scan lines */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 4px)",
          }}
        />
        {/* Glitch lines */}
        <div
          className="absolute left-0 right-0 h-[2px] bg-primary/30 animate-pulse"
          style={{ top: "23%", animationDelay: "0.3s" }}
        />
        <div
          className="absolute left-0 right-0 h-[1px] bg-destructive/20 animate-pulse"
          style={{ top: "67%", animationDelay: "0.7s" }}
        />
        <div
          className="absolute left-0 right-0 h-[2px] bg-primary/20 animate-pulse"
          style={{ top: "78%", animationDelay: "1.1s" }}
        />
      </div>

      {/* Floating elements */}
      <div className="pointer-events-none absolute inset-0">
        <SignalZero
          className="absolute left-[8%] top-[15%] size-10 text-destructive/15 animate-bounce"
          style={{ animationDelay: "0.2s", animationDuration: "3s" }}
        />
        <Compass
          className="absolute right-[12%] top-[25%] size-8 text-primary/15 animate-bounce"
          style={{ animationDelay: "0.8s", animationDuration: "4s" }}
        />
        <MapPinOff
          className="absolute left-[15%] bottom-[20%] size-12 text-muted-foreground/10 animate-bounce"
          style={{ animationDelay: "1.2s", animationDuration: "3.5s" }}
        />
        <Signal
          className="absolute right-[8%] bottom-[30%] size-6 text-primary/15 animate-bounce"
          style={{ animationDelay: "1.8s", animationDuration: "2.8s" }}
        />
        <Radar
          className="absolute left-[25%] top-[40%] size-5 text-destructive/10 animate-pulse"
          style={{ animationDelay: "0.5s", animationDuration: "2s" }}
        />
      </div>

      {/* Radar circles background */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="absolute -inset-32 rounded-full border border-primary/5 animate-ping"
          style={{ animationDuration: "3s" }}
        />
        <div
          className="absolute -inset-48 rounded-full border border-primary/5 animate-ping"
          style={{ animationDuration: "4s", animationDelay: "1s" }}
        />
        <div
          className="absolute -inset-64 rounded-full border border-primary/5 animate-ping"
          style={{ animationDuration: "5s", animationDelay: "2s" }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-4 max-w-lg">
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/90 p-8 shadow-2xl backdrop-blur-md">
          {/* Top stripe with gradient */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-destructive to-primary" />

          {/* Glowing 404 */}
          <div className="mb-6 flex justify-center">
            <span
              className="relative font-mono text-8xl font-black bg-gradient-to-b from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"
              style={{
                textShadow: "0 0 60px oklch(0.6132 0.2294 291.7437 / 0.4)",
              }}
            >
              404
            </span>
          </div>

          {/* Icon */}
          <div className="mb-5 flex justify-center">
            <div className="relative">
              <div
                className="absolute inset-0 animate-ping rounded-full bg-destructive/20"
                style={{ animationDuration: "2s" }}
              />
              <div className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/50 border border-border shadow-inner">
                <Radar className="size-8 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-2 text-center font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            <span className="text-primary">&lt;</span>
            SIGNAL LOST
            <span className="text-primary">/&gt;</span>
          </h1>

          {/* Subtitle */}
          <p className="mb-6 text-center text-muted-foreground text-sm">
            The page you're looking for doesn't exist or has been moved.
            <br />
            <span className="text-xs opacity-75">Perhaps the ARC took it?</span>
          </p>

          {/* Divider */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <SignalZero className="size-4 text-muted-foreground" />
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default" className="group">
              <Link to="/">
                <Home className="size-4 transition-transform group-hover:-translate-y-0.5" />
                <span className="font-medium">Return Home</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="group">
              <Link to="/items">
                <Search className="size-4 transition-transform group-hover:scale-110" />
                <span className="font-medium">Browse Items</span>
              </Link>
            </Button>
          </div>

          {/* Go back link */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => window.history.back()}
              className="group inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />
              <span>Go back to previous page</span>
            </button>
          </div>

          {/* Bottom stripe */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary via-destructive to-primary opacity-50" />
        </div>

        {/* Shadow glow */}
        <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/5 blur-2xl" />
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}
