import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Centered loading spinner with optional label. */
export function Spinner({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Empty-state placeholder for tables/lists with no data. */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
