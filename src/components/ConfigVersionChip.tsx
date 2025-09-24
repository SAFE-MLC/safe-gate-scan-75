import { cn } from "@/lib/utils";
import { AlertTriangle, Check } from "lucide-react";

interface ConfigVersionChipProps {
  version: number;
  isStale?: boolean;
  className?: string;
}

const ConfigVersionChip = ({ version, isStale = false, className }: ConfigVersionChipProps) => {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
      isStale 
        ? "bg-warning/20 text-warning border border-warning/30"
        : "bg-muted text-muted-foreground border border-border",
      className
    )}>
      {isStale ? <AlertTriangle size={14} /> : <Check size={14} />}
      <span>cfg v.{version}</span>
    </div>
  );
};

export default ConfigVersionChip;