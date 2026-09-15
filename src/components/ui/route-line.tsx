import { cn } from "@/lib/utils";

/**
 * The signature gold line. A horizontal or vertical hairline with a small
 * terminal node. Used as section dividers and timeline spines.
 */
export function RouteLine({
  orientation = "horizontal",
  className,
  node = "end",
}: {
  orientation?: "horizontal" | "vertical";
  className?: string;
  node?: "start" | "end" | "both" | "none";
}) {
  const horiz = orientation === "horizontal";
  return (
    <div
      aria-hidden
      className={cn("relative flex items-center", horiz ? "h-px w-full" : "w-px h-full flex-col", className)}
    >
      {(node === "start" || node === "both") && <span className="absolute size-1.5 rounded-full bg-route" style={horiz ? { left: 0 } : { top: 0 }} />}
      <span className={cn("bg-route/60", horiz ? "h-px w-full" : "w-px h-full")} />
      {(node === "end" || node === "both") && <span className="absolute size-1.5 rounded-full bg-route" style={horiz ? { right: 0 } : { bottom: 0 }} />}
    </div>
  );
}
