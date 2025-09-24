import { cn } from "@/lib/utils";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";

interface ConnectivityChipProps {
  online: boolean;
  clockDriftSec?: number;
  className?: string;
}

const ConnectivityChip = ({ online, clockDriftSec = 0, className }: ConnectivityChipProps) => {
  const hasClockDrift = Math.abs(clockDriftSec) > 60;
  
  if (!online) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
        "bg-error/20 text-error border border-error/30",
        className
      )}>
        <WifiOff size={14} />
        <span>OFFLINE</span>
      </div>
    );
  }

  if (hasClockDrift) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
        "bg-warning/20 text-warning border border-warning/30",
        className
      )}>
        <AlertCircle size={14} />
        <span>CLOCK DRIFT</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
      "bg-success/20 text-success border border-success/30",
      className
    )}>
      <Wifi size={14} />
      <span>ONLINE</span>
    </div>
  );
};

export default ConnectivityChip;