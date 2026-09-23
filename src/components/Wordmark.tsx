import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  /** Compact treatment for the ≤640px header — smaller size, no bracket accent. */
  compact?: boolean;
}

/** Text-based "MapPicker" wordmark — `Map` in foreground, `Picker` in the accent color. */
export function Wordmark({ className, compact = false }: WordmarkProps) {
  return (
    <span
      className={cn(
        "font-display -tracking-[0.02em] font-bold uppercase select-none",
        compact ? "text-body-lg" : "text-display-md",
        className,
      )}
    >
      <span className="text-foreground">Map</span>
      <span className="text-primary">Picker</span>
    </span>
  );
}
