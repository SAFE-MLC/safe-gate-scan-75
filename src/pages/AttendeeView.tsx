// src/pages/AttendeeView.tsx - VERSIÓN ORIGINAL QUE FUNCIONABA
import { useState, useEffect } from "react";
import { Info, Clock, Wifi, WifiOff, RefreshCw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import SuperSimpleQR from "@/components/QRCode";
import { mockTicket, mockEntitlements } from "@/data/mockData";
import { useRotatingQR } from "@/hooks/useRotatingQR";

const AttendeeView = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [brightness, setBrightness] = useState(100);

  // Configuración simple - usar datos del login si existen, sino usar mock
  const storedSession = localStorage.getItem('ticketSession');
  let ticketId = 'TK-001';
  
  if (storedSession) {
    try {
      const sessionData = JSON.parse(storedSession);
      ticketId = sessionData.ticketId;
    } catch (error) {
      console.log('Usando ticket por defecto');
    }
  }

  const QR_CONFIG = {
    ticketId: ticketId,
    eventId: 'evt_1',
    backofficeUrl: 'http://localhost:8080',
    qrTtlSeconds: 20,
    syncIntervalMs: 60000,
    clockSkewSeconds: 0
  };

  // Hook para manejar QR rotativo
  const qrState = useRotatingQR(QR_CONFIG);

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const increaseBrightness = () => {
    setBrightness(150);
    setTimeout(() => setBrightness(100), 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem('ticketSession');
    window.location.href = '/login';
  };

  // Determinar color del timer
  const getTimerColor = () => {
    if (qrState.timeRemaining <= 5) return 'text-red-600';
    if (qrState.timeRemaining <= 10) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div 
      className="min-h-screen bg-background flex flex-col"
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {/* Header */}
      <header className="p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">SuperFest 2025</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">
              {currentTime.toLocaleTimeString()}
            </p>
            {qrState.isOnline ? (
              <Wifi size={16} className="text-green-500" />
            ) : (
              <WifiOff size={16} className="text-red-500" />
            )}
            
            <Button variant="ghost" size="sm" onClick={handleLogout} className="ml-2">
              <LogOut size={14} className="mr-1" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* QR Code Section */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          
          {/* Error State */}
          {qrState.error && !qrState.isLoading && (
            <Card className="bg-red-50 border-red-200 p-4 mb-4">
              <div className="text-center">
                <WifiOff size={24} className="text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-600 mb-3">{qrState.error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={qrState.retry}
                  className="border-red-200"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Reintentar
                </Button>
              </div>
            </Card>
          )}

          {/* QR Code Card */}
          <Card className="bg-white p-8 relative">
            <div className="absolute top-4 right-4">
              <div className={`flex items-center gap-1 text-xs ${getTimerColor()}`}>
                <Clock size={12} />
                <span>{qrState.timeRemaining}s</span>
              </div>
            </div>
            
            <div className="absolute top-4 left-4">
              <button
                onClick={qrState.forceRotate}
                className="p-1 hover:bg-gray-100 rounded"
                title="Regenerar QR"
              >
                <RefreshCw size={14} className="text-gray-400" />
              </button>
            </div>
            
            {/* QR Content */}
            <div className="aspect-square bg-black/5 rounded-lg flex items-center justify-center relative">
              <div className="absolute inset-2 border-2 border-black opacity-10 rounded" />
              <div className="absolute inset-4 border border-black opacity-10 rounded" />
              <div className="absolute inset-6 border-2 border-black opacity-10 rounded" />
              
              {/* QR Display */}
              <div className="text-center">
                {qrState.currentJWT ? (
                  <div className="space-y-2">
                    <div className="mx-auto">
                      <SuperSimpleQR value={qrState.currentJWT} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <RefreshCw 
                      size={120} 
                      className="text-gray-300 mx-auto animate-spin" 
                    />
                    <p className="text-xs text-gray-500">Generando QR...</p>
                  </div>
                )}
                
                {qrState.lastSync && (
                  <p className="text-xs text-gray-400 mt-2">
                    Última sincronización: {qrState.lastSync.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full mt-4 text-gray-600"
              onClick={increaseBrightness}
            >
              Aumentar brillo
            </Button>
          </Card>

          {/* Ticket Info */}
          <div className="mt-6 space-y-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {ticketId}
              </p>
            </div>

            {/* Connection Status */}
            <div className="text-center">
              <StatusBadge 
                variant={qrState.isOnline ? "success" : "error"} 
                size="sm"
              >
                {qrState.isLoading ? "Conectando..." : 
                 qrState.isOnline ? "Conectado" : "Sin conexión"}
              </StatusBadge>
              
              {qrState.sessionInfo && (
                <p className="text-xs text-muted-foreground mt-1">
                  Sesión válida hasta: {new Date(qrState.sessionInfo.exp * 1000).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendeeView;