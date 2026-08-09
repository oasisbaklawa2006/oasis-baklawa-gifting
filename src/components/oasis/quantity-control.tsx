import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
};

export function QuantityControl({ value, onChange, min = 1, max = 99, label = "Quantity", className }: Props) {
  return (
    <div className={cn("inline-flex h-11 items-center rounded-sm border border-border", className)}>
      <button
        type="button"
        className="grid h-11 w-11 place-items-center text-foreground transition-colors hover:bg-premium disabled:opacity-40"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
      >
        <Minus className="size-4" />
      </button>
      <output className="w-10 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className="grid h-11 w-11 place-items-center text-foreground transition-colors hover:bg-premium disabled:opacity-40"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
