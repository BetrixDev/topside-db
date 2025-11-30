import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { UsersIcon } from "lucide-react";
import { startCase } from "es-toolkit/string";

interface TraderCardProps {
  traderId: string;
  name?: string | null;
  imageUrl?: string | null;
  currency?: string | null;
  className?: string;
}

export function TraderCard({
  traderId,
  name,
  imageUrl,
  currency,
  className,
}: TraderCardProps) {
  const currencyLabel = currency ? startCase(currency) : "Credits";

  return (
    <Link
      to="/traders/$traderId"
      params={{ traderId }}
      className={cn("group block", className)}
      aria-label={`View ${name ?? traderId} trader profile`}
      preload="intent"
    >
      <div className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm transition-colors duration-200 group-hover:border-primary/50 group-hover:bg-card">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-background/70">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name ?? "Trader"}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <UsersIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {name ?? startCase(traderId)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
