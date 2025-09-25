import { useState, useEffect } from "react";
import { Info, Wifi, WifiOff } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import QRDisplay from "@/components/QRDisplay";
import ConnectionStatus from "@/components/ConnectionStatus";
import { mockTicket, mockEntitlements } from "@/data/mockData";
import { useRotatingQR } from "@/hooks/useRotatingQR";

const AttendeeView = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [brightness, setBrightness] = useState(100);

  // Configuración
  const QR_CONFIG = {
    ticketId: mockTicket.ticketId,
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
          </div>
        </div>
      </header>

      {/* QR Code Section */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">

          {/* QR Code Display */}
          <QRDisplay
            jwt={qrState.currentJWT}
            timeRemaining={qrState.timeRemaining}
            lastSync={qrState.lastSync}
            onRefresh={qrState.forceRotate}
            onBrightnessBoost={increaseBrightness}
            isLoading={qrState.isLoading}
          />

          {/* Ticket Info */}
          <div className="mt-6 space-y-3">
            <div className="text-center">
              <p className="text-xl font-semibold">{mockTicket.meta.holderName}</p>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {mockTicket.ticketId}
              </p>
            </div>

            {/* Connection Status - Simplified */}
            <ConnectionStatus
              isOnline={qrState.isOnline}
              isLoading={qrState.isLoading}
              error={qrState.error}
              sessionInfo={qrState.sessionInfo}
              onRetry={qrState.retry}
            />

            {/* Zones */}
            <div className="flex flex-wrap justify-center gap-2">
              {mockEntitlements.slice(0, 3).map((zone) => (
                <div
                  key={zone.zoneId}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                >
                  {zone.zoneName}
                </div>
              ))}
            </div>

            {/* Entry gates */}
            {mockTicket.gateAllowlist && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Puertas habilitadas</p>
                <div className="flex justify-center gap-2">
                  {mockTicket.gateAllowlist.map(gate => (
                    <StatusBadge key={gate} variant="info" size="sm" showIcon={false}>
                      {gate}
                    </StatusBadge>
                  ))}
                </div>
              </div>
            )}

            {/* Debug Info (solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && qrState.currentJWT && (
              <details className="mt-4">
                <summary className="text-xs text-gray-500 cursor-pointer">
                  Debug Info
                </summary>
                <div className="text-xs text-gray-400 mt-2 font-mono bg-gray-50 p-2 rounded">
                  <p>Evento: {QR_CONFIG.eventId}</p>
                  <p>Venue: SuperFest 2025</p>
                  <p>TTL: {QR_CONFIG.qrTtlSeconds}s</p>
                  <p>Sync: {QR_CONFIG.syncIntervalMs}ms</p>
                  <p>JWT Length: {qrState.currentJWT.length}</p>
                  <p>Conectado: {qrState.isOnline ? 'Sí' : 'No'}</p>
                  <p>Backoffice: {QR_CONFIG.backofficeUrl}</p>
                </div>
              </details>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 border-t border-border">
        <button 
          className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground"
          onClick={() => {
            const eventInfo = `SuperFest 2025\nFecha: 25 Sept 2025\nVenue: Estadio Nacional`;
            alert(`Información del evento:\n${eventInfo}`);
          }}
        >
          <Info size={16} />
          Información del evento
        </button>
      </footer>
    </div>
  );
};

export default AttendeeView;