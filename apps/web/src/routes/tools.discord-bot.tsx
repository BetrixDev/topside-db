import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  MessageSquare,
  Users,
  Zap,
  Shield,
  ExternalLink,
  Sparkles,
  Radio,
  Terminal,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tools/discord-bot")({
  component: DiscordBotPage,
});

function DiscordBotPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-linear-to-br from-indigo-950/30 via-background to-violet-950/20">
      {/* Animated circuit/data lines */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 50px, currentColor 50px, currentColor 51px), repeating-linear-gradient(0deg, transparent, transparent 50px, currentColor 50px, currentColor 51px)",
          }}
        />
        {/* Glowing data streams */}
        <div
          className="absolute left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-500/40 to-transparent animate-pulse"
          style={{ top: "20%", animationDelay: "0s" }}
        />
        <div
          className="absolute left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-violet-500/30 to-transparent animate-pulse"
          style={{ top: "45%", animationDelay: "0.5s" }}
        />
        <div
          className="absolute left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-500/40 to-transparent animate-pulse"
          style={{ top: "75%", animationDelay: "1s" }}
        />
      </div>

      {/* Floating elements */}
      <div className="pointer-events-none absolute inset-0">
        <MessageSquare
          className="absolute left-[8%] top-[18%] size-8 text-indigo-500/20 animate-bounce"
          style={{ animationDelay: "0.2s", animationDuration: "3.5s" }}
        />
        <Users
          className="absolute right-[12%] top-[22%] size-10 text-violet-500/15 animate-bounce"
          style={{ animationDelay: "0.8s", animationDuration: "4s" }}
        />
        <Zap
          className="absolute left-[15%] bottom-[25%] size-6 text-indigo-400/20 animate-bounce"
          style={{ animationDelay: "1.2s", animationDuration: "3s" }}
        />
        <Radio
          className="absolute right-[10%] bottom-[30%] size-8 text-violet-500/15 animate-bounce"
          style={{ animationDelay: "1.6s", animationDuration: "3.8s" }}
        />
        <Terminal
          className="absolute left-[25%] top-[35%] size-5 text-indigo-500/15 animate-pulse"
          style={{ animationDelay: "0.4s", animationDuration: "2.5s" }}
        />
        <Cpu
          className="absolute right-[20%] bottom-[15%] size-7 text-violet-400/15 animate-pulse"
          style={{ animationDelay: "1s", animationDuration: "2s" }}
        />
      </div>

      {/* Pulsing rings background */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="absolute -inset-40 rounded-full border border-indigo-500/10 animate-ping"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute -inset-56 rounded-full border border-violet-500/10 animate-ping"
          style={{ animationDuration: "5s", animationDelay: "1s" }}
        />
        <div
          className="absolute -inset-72 rounded-full border border-indigo-500/5 animate-ping"
          style={{ animationDuration: "6s", animationDelay: "2s" }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-4 max-w-xl w-full">
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-card/90 p-8 shadow-2xl backdrop-blur-md">
          {/* Top gradient stripe */}
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-indigo-500 via-violet-500 to-indigo-500" />

          {/* Bot icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div
                className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20"
                style={{ animationDuration: "2.5s" }}
              />
              <div className="relative flex size-20 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                <Bot className="size-10 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-2 text-center font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            <span className="text-indigo-500">&lt;</span>
            TOPSIDE BOT
            <span className="text-indigo-500">/&gt;</span>
          </h1>

          {/* Subtitle */}
          <p className="mb-6 text-center text-muted-foreground">
            Your ARC Raiders companion for Discord.
            <br />
            <span className="text-sm opacity-80">
              Track items, get updates, and connect with the community.
            </span>
          </p>

          {/* Feature highlights */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            <FeatureCard
              icon={<Shield className="size-5" />}
              label="Item Lookup"
            />
            <FeatureCard
              icon={<Sparkles className="size-5" />}
              label="Up-to-date"
            />
            <FeatureCard
              icon={<Users className="size-5" />}
              label="Easy to use"
            />
          </div>

          {/* Divider */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-linear-to-r from-transparent via-indigo-500/30 to-transparent" />
            <Zap className="size-4 text-indigo-500" />
            <div className="h-px flex-1 bg-linear-to-r from-transparent via-indigo-500/30 to-transparent" />
          </div>

          {/* Add bot CTA */}
          <div className="flex flex-col items-center gap-4">
            <Button
              asChild
              size="lg"
              className="group w-full sm:w-auto bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30"
            >
              <a
                href="https://discord.com/oauth2/authorize?client_id=1444683621565726875&permissions=0&integration_type=0&scope=applications.commands+bot"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Bot className="size-5 transition-transform group-hover:scale-110" />
                <span className="font-semibold">Add to Discord</span>
                <ExternalLink className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Free to use • No setup required • Instant access
            </p>
          </div>

          {/* Bottom gradient stripe */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-linear-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-60" />
        </div>

        {/* Shadow glow */}
        <div className="absolute -inset-4 -z-10 rounded-3xl bg-indigo-500/10 blur-2xl" />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-3 transition-colors hover:border-indigo-500/20 hover:bg-indigo-500/10">
      <div className="text-indigo-400">{icon}</div>
      <span className="text-xs font-medium text-center text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
