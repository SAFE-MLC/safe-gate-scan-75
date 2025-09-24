import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { ValidationResult } from "@/types";

interface ValidationToastProps {
  result: ValidationResult | null;
  onClose: () => void;
}

const ValidationToast = ({ result, onClose }: ValidationToastProps) => {
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [result, onClose]);

  if (!result) return null;

  const getIcon = () => {
    switch (result.status) {
      case 'ALLOW':
        return <CheckCircle className="w-12 h-12" />;
      case 'WARN-OFFLINE':
        return <AlertTriangle className="w-12 h-12" />;
      default:
        return <XCircle className="w-12 h-12" />;
    }
  };

  const getColorClasses = () => {
    switch (result.status) {
      case 'ALLOW':
        return 'bg-success text-success-foreground';
      case 'WARN-OFFLINE':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-error text-error-foreground';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className={cn(
        "flex flex-col items-center gap-3 p-6 rounded-2xl",
        "shadow-2xl animate-in fade-in zoom-in duration-300",
        getColorClasses()
      )}>
        {getIcon()}
        <p className="text-xl font-bold">{result.message}</p>
      </div>
    </div>
  );
};

export default ValidationToast;