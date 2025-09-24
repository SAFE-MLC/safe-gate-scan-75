import { cn } from "@/lib/utils";
import { Clock, RotateCcw } from "lucide-react";
import { Entitlement } from "@/types";

interface ZoneChipProps {
  entitlement: Entitlement;
  onClick?: () => void;
  className?: string;
}

const ZoneChip = ({ entitlement, onClick, className }: ZoneChipProps) => {
  const hasTimeWindow = entitlement.timeWindow !== null;
  const hasReentryLeft = entitlement.reentryLimit === 0 || 
    (entitlement.reentryUsed < entitlement.reentryLimit);

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
        "bg-card border border-border",
        "hover:bg-accent/10 hover:border-accent transition-all",
        "text-sm font-medium",
        onClick && "cursor-pointer",
        className
      )}
    >
      <span className="font-semibold">{entitlement.zoneName}</span>
      
      {hasTimeWindow && entitlement.timeWindow && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock size={12} />
          <span>{entitlement.timeWindow.start}-{entitlement.timeWindow.end}</span>
        </div>
      )}
      
      {entitlement.reentryLimit > 0 && (
        <div className={cn(
          "flex items-center gap-1 text-xs",
          hasReentryLeft ? "text-success" : "text-error"
        )}>
          <RotateCcw size={12} />
          <span>{entitlement.reentryLimit - entitlement.reentryUsed}/{entitlement.reentryLimit}</span>
        </div>
      )}
    </button>
  );
};

export default ZoneChip;