import * as React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { ScrollTextIcon, GiftIcon } from "lucide-react";

interface QuestCardProps {
  questId: string;
  name?: string | null;
  quantity?: number | null;
  variant?: "default" | "reward";
  className?: string;
}

export function QuestCard({
  questId,
  name,
  quantity,
  variant = "default",
  className,
}: QuestCardProps) {
  const Icon = variant === "reward" ? GiftIcon : ScrollTextIcon;

  return (
    <Link
      to="/quests/$questId"
      params={{ questId }}
      className={cn(
        "group flex items-center bg-card hover:bg-background rounded-lg border border-border hover:border-primary/50 transition-colors p-3 gap-3",
        className
      )}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-amber-500" />
      </div>
      <div className="flex flex-col gap-0.5 justify-center min-w-0 flex-1">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {name ?? questId}
        </p>
        {quantity != null && (
          <p className="text-xs text-muted-foreground">
            {variant === "reward" ? `Reward: ${quantity}x` : `${quantity}x required`}
          </p>
        )}
      </div>
    </Link>
  );
}

