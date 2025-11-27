import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export function SectionCard({
  icon: Icon,
  title,
  children,
  className,
  headerAction,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "bg-secondary rounded-lg border border-border/50 p-6",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {headerAction}
      </div>
      {children}
    </div>
  );
}

