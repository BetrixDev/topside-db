import * as React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { PackageIcon } from "lucide-react";

interface ItemCardProps {
  itemId: string;
  name?: string | null;
  imageUrl?: string | null;
  quantity?: number | null;
  subtitle?: string;
  className?: string;
}

export function ItemCard({
  itemId,
  name,
  imageUrl,
  quantity,
  subtitle,
  className,
}: ItemCardProps) {
  return (
    <Link
      to="/items/$itemId"
      params={{ itemId }}
      className={cn(
        "group flex bg-card hover:bg-background rounded-lg border border-border hover:border-primary/50 transition-colors p-2 gap-3",
        className
      )}
    >
      <div className="relative flex-shrink-0 w-12 h-12 rounded-md bg-background/50 border border-border/30 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name ?? "Item"}
            className="w-full h-full object-contain p-1"
          />
        ) : (
          <PackageIcon className="w-6 h-6 text-muted-foreground/50" />
        )}
      </div>
      <div className="flex flex-col gap-0.5 justify-center min-w-0 flex-1">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {name ?? itemId}
        </p>
        {quantity != null && (
          <p className="text-xs text-muted-foreground">{quantity}x</p>
        )}
        {subtitle && !quantity && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </Link>
  );
}

interface ItemCardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function ItemCardGrid({ children, className }: ItemCardGridProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>{children}</div>
  );
}

