import { cn } from "@/lib/utils";
import { MapPin, Clock } from "lucide-react";
import { HistoryAttempt } from "@/types";
import StatusBadge from "./StatusBadge";

interface AttemptRowProps {
  attempt: HistoryAttempt;
  className?: string;
}

const AttemptRow = ({ attempt, className }: AttemptRowProps) => {
  const getStatusVariant = (result: string): 'success' | 'error' | 'warning' => {
    if (result === 'ALLOW') return 'success';
    if (result.startsWith('DENY')) return 'error';
    return 'warning';
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg",
      "bg-card border border-border",
      "hover:bg-accent/5 transition-all",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm">
            <Clock size={14} className="text-muted-foreground" />
            <span className="font-medium">{attempt.timestamp}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin size={12} />
            <span>{attempt.location}</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-1">
        <StatusBadge 
          variant={getStatusVariant(attempt.result)} 
          size="sm"
          showIcon={false}
        >
          {attempt.result}
        </StatusBadge>
        {attempt.reason && (
          <span className="text-xs text-muted-foreground">{attempt.reason}</span>
        )}
      </div>
    </div>
  );
};

export default AttemptRow;