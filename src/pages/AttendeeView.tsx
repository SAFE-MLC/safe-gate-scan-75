import { useState, useEffect } from "react";
import { QrCode, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import { mockTicket, mockEntitlements } from "@/data/mockData";

const AttendeeView = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [qrCode, setQrCode] = useState(`QR-${Date.now()}`);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [brightness, setBrightness] = useState(100);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const qrTimer = setInterval(() => {
      setQrCode(`QR-${Date.now()}`);
      setTimeRemaining(30);
    }, 30000);

    const countdownTimer = setInterval(() => {
      setTimeRemaining(prev => prev > 0 ? prev - 1 : 30);
    }, 1000);

    return () => {
      clearInterval(qrTimer);
      clearInterval(countdownTimer);
    };
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
      {/* Minimalist Header */}
      <header className="p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">SuperFest 2025</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentTime.toLocaleTimeString()}
          </p>
        </div>
      </header>

      {/* QR Code Section */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* QR Code Card */}
          <Card className="bg-white p-8 relative">
            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Clock size={12} />
                <span>{timeRemaining}s</span>
              </div>
            </div>
            
            {/* QR Placeholder */}
            <div className="aspect-square bg-black/5 rounded-lg flex items-center justify-center relative">
              <div className="absolute inset-2 border-2 border-black opacity-10 rounded" />
              <div className="absolute inset-4 border border-black opacity-10 rounded" />
              <div className="absolute inset-6 border-2 border-black opacity-10 rounded" />
              
              {/* Center QR icon and code */}
              <div className="text-center">
                <QrCode size={120} className="text-black mx-auto mb-2" />
                <p className="text-xs font-mono text-gray-600">{qrCode}</p>
              </div>
            </div>

            {/* Brightness boost button */}
            <Button
              variant="ghost"
              className="w-full mt-4 text-gray-600"
              onClick={increaseBrightness}
            >
              Aumentar brillo
            </Button>
          </Card>

          {/* Ticket Info - Minimalist */}
          <div className="mt-6 space-y-3">
            <div className="text-center">
              <p className="text-xl font-semibold">{mockTicket.meta.holderName}</p>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {mockTicket.ticketId}
              </p>
            </div>

            {/* Zones - Simple chips */}
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
          </div>
        </div>
      </div>

      {/* Minimalist Footer */}
      <footer className="p-4 border-t border-border">
        <button className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Info size={16} />
          Información del evento
        </button>
      </footer>
    </div>
  );
};

export default AttendeeView;