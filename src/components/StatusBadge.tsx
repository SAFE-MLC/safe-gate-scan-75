import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

export type StatusVariant = 'success' | 'error' | 'warning' | 'info';

interface StatusBadgeProps {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge = ({ 
  variant, 
  children, 
  className,
  showIcon = true,
  size = 'md' 
}: StatusBadgeProps) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[variant];
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2'
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20
  };

  return (
    <div
      className={cn(
        "inline-flex items-center font-semibold rounded-lg transition-all",
        sizeClasses[size],
        {
          'bg-success text-success-foreground': variant === 'success',
          'bg-error text-error-foreground': variant === 'error',
          'bg-warning text-warning-foreground': variant === 'warning',
          'bg-info text-info-foreground': variant === 'info',
        },
        className
      )}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      <span>{children}</span>
    </div>
  );
};

export default StatusBadge;