// src/components/QRDisplay.tsx
import { Clock, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SuperSimpleQR from "@/components/QRCode";

interface QRDisplayProps {
  jwt: string;
  timeRemaining: number;
  lastSync: Date | null;
  onRefresh: () => void;
  onBrightnessBoost: () => void;
  isLoading?: boolean;
}

const QRDisplay = ({ 
  jwt, 
  timeRemaining, 
  lastSync, 
  onRefresh, 
  onBrightnessBoost,
  isLoading = false 
}: QRDisplayProps) => {
  
  console.log("🎯 QRDisplay: Renderizando con JWT =", !!jwt, "length =", jwt?.length);
  
  // Determinar el color del timer basado en el tiempo restante
  const getTimerColor = () => {
    if (timeRemaining <= 5) return 'text-red-600';
    if (timeRemaining <= 10) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <Card className="bg-white p-8 relative">
      {/* Timer */}
      <div className="absolute top-4 right-4">
        <div className={`flex items-center gap-1 text-xs ${getTimerColor()}`}>
          <Clock size={12} />
          <span className="font-mono">{timeRemaining}s</span>
        </div>
      </div>
      
      {/* Manual Refresh Button */}
      <div className="absolute top-4 left-4">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          title="Regenerar QR"
        >
          <RefreshCw 
            size={14} 
            className={`text-gray-400 ${isLoading ? 'animate-spin' : ''}`} 
          />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 rounded-t-lg">
        <div 
          className="h-full bg-primary rounded-t-lg transition-all duration-1000 ease-linear"
          style={{ width: `${(timeRemaining / 20) * 100}%` }}
        />
      </div>
      
      {/* QR CONTENT - ESTA ES LA PARTE IMPORTANTE */}
      <div className="bg-gray-50 rounded-lg flex items-center justify-center relative p-4 min-h-[200px]">
        <div className="text-center w-full">
          <div className="space-y-3">
            {/* AQUI ESTA EL COMPONENTE SuperSimpleQR */}
            <div className="flex justify-center">
              <SuperSimpleQR value={jwt} />
            </div>
            
            {/* JWT Info */}
            {jwt && (
              <div className="text-xs text-gray-500 space-y-1">
                <div className="font-mono">
                  JWT: {jwt.split('.').length} partes • {jwt.length} chars
                </div>
                <div className="text-gray-400">
                  Algoritmo: HS256 • Rotación: {timeRemaining}s
                </div>
              </div>
            )}
            
            {/* Debug visible */}
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              Debug: JWT = {jwt ? "✅ Presente" : "❌ Ausente"}
            </div>
          </div>
          
          {/* Last Sync Info */}
          {lastSync && jwt && (
            <div className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
              ⟳ Sincronizado: {lastSync.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Brightness Boost Button */}
      <Button
        variant="ghost"
        className="w-full mt-4 text-gray-600 hover:bg-gray-50"
        onClick={onBrightnessBoost}
      >
        Aumentar brillo
      </Button>
    </Card>
  );
};

export default QRDisplay;