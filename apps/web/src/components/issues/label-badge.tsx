import { cn } from "@/lib/utils";

export function LabelBadge({
  name,
  color,
  className,
}: {
  name: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-1.5 py-0.5 text-xs font-medium",
        className,
      )}
      style={{
        borderColor: `${color}40`,
        backgroundColor: `${color}15`,
        color: color,
      }}
    >
      <span className="h-2 w-2 shrink-0" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}
