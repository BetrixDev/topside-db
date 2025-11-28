import * as React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { ZapIcon, ShieldAlertIcon, HeartIcon } from "lucide-react";

function getThreatLevelColor(threatLevel: string | null | undefined) {
  switch (threatLevel?.toLowerCase()) {
    case "low":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "medium":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "high":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "extreme":
    case "critical":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

interface ArcCardProps {
  arcId: string;
  name?: string | null;
  imageUrl?: string | null;
  threatLevel?: string | null;
  health?: number | null;
  className?: string;
}

export function ArcCard({
  arcId,
  name,
  imageUrl,
  threatLevel,
  health,
  className,
}: ArcCardProps) {
  return (
    <Link
      to="/arcs/$arcId"
      params={{ arcId }}
      className={cn(
        "group flex items-center bg-card hover:bg-background rounded-lg border border-border hover:border-primary/50 transition-colors p-3 gap-3",
        className
      )}
    >
      <div className="relative shrink-0 w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name ?? "Arc"}
            className="w-full h-full object-cover"
          />
        ) : (
          <ZapIcon className="w-5 h-5 text-red-500" />
        )}
      </div>
      <div className="flex flex-col gap-0.5 justify-center min-w-0 flex-1">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {name ?? arcId}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {threatLevel && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                getThreatLevelColor(threatLevel)
              )}
            >
              <ShieldAlertIcon className="w-3 h-3" />
              {threatLevel}
            </span>
          )}
          {health != null && (
            <span className="inline-flex items-center gap-1 text-rose-500">
              <HeartIcon className="w-3 h-3" />
              {health.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
