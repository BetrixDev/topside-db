import * as React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { HammerIcon, ArrowUpIcon } from "lucide-react";

interface HideoutCardProps {
  hideoutId: string;
  name?: string | null;
  level?: number | null;
  quantity?: number | null;
  className?: string;
}

export function HideoutCard({
  hideoutId,
  name,
  level,
  quantity,
  className,
}: HideoutCardProps) {
  return (
    <Link
      to="/hideout/$workbenchId"
      params={{ workbenchId: hideoutId }}
      className={cn(
        "group flex items-center bg-card hover:bg-background rounded-lg border border-border hover:border-primary/50 transition-colors p-3 gap-3",
        className
      )}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <HammerIcon className="w-5 h-5 text-emerald-500" />
      </div>
      <div className="flex flex-col gap-0.5 justify-center min-w-0 flex-1">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {name ?? hideoutId}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {level != null && (
            <span className="flex items-center gap-1">
              <ArrowUpIcon className="w-3 h-3" />
              Level {level}
            </span>
          )}
          {quantity != null && (
            <span className="text-muted-foreground">• {quantity}x needed</span>
          )}
        </div>
      </div>
    </Link>
  );
}

