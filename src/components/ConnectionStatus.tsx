// src/components/ConnectionStatus.tsx
import { Wifi, WifiOff, RefreshCw, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import type { SessionInfo } from "@/services/BackofficeService";

interface ConnectionStatusProps {
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
  sessionInfo: SessionInfo | null;
  onRetry: () => void;
}

const ConnectionStatus = ({ 
  isOnline, 
  isLoading, 
  error, 
  sessionInfo, 
  onRetry 
}: ConnectionStatusProps) => {
  
  // Loading State
  if (isLoading) {
    return (
      <Card className="bg-blue-50 border-blue-200 p-4 mb-4">
        <div className="text-center">
          <RefreshCw size={24} className="text-blue-500 mx-auto mb-2 animate-spin" />
          <p className="text-sm text-blue-600 font-medium">Conectando al servidor...</p>
          <p className="text-xs text-blue-500 mt-1">Obteniendo información de sesión</p>
        </div>
      </Card>
    );
  }

  // Error State
  if (error) {
    return (
      <Card className="bg-red-50 border-red-200 p-4 mb-4">
        <div className="text-center">
          <WifiOff size={24} className="text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 font-medium mb-1">Error de conexión</p>
          <p className="text-xs text-red-500 mb-3">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="border-red-200 text-red-600 hover:bg-red-100"
          >
            <RefreshCw size={16} className="mr-2" />
            Reintentar conexión
          </Button>
        </div>
      </Card>
    );
  }

  // Success State with Session Info
  if (isOnline && sessionInfo) {
    const sessionExpiresAt = new Date(sessionInfo.exp * 1000);
    const isSessionExpiringSoon = sessionExpiresAt.getTime() - Date.now() < 300000; // 5 minutos
    
    return (
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <StatusBadge variant="success" size="sm">
            <Wifi size={12} className="mr-1" />
            Conectado
          </StatusBadge>
          
          {isSessionExpiringSoon && (
            <StatusBadge variant="warning" size="sm">
              <AlertCircle size={12} className="mr-1" />
              Sesión expira pronto
            </StatusBadge>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>Sesión válida hasta:</p>
          <p className={`font-mono ${isSessionExpiringSoon ? 'text-yellow-600' : ''}`}>
            {sessionExpiresAt.toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  // Offline State
  return (
    <div className="text-center">
      <StatusBadge variant="error" size="sm">
        <WifiOff size={12} className="mr-1" />
        Sin conexión
      </StatusBadge>
      <p className="text-xs text-muted-foreground mt-1">
        Funcionando en modo offline
      </p>
    </div>
  );
};

export default ConnectionStatus;