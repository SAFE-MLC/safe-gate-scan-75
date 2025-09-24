import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import ZoneChip from "@/components/ZoneChip";
import AttemptRow from "@/components/AttemptRow";
import { mockTicket, mockEntitlements, mockHistory } from "@/data/mockData";
import { Entitlement, ZoneValidationResult } from "@/types";
import { useToast } from "@/hooks/use-toast";

const TicketDetailView = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [zoneValidateOpen, setZoneValidateOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Entitlement | null>(null);
  const ticket = mockTicket;
  const isAllowed = ticket.status === 'active';

  const copyTicketId = () => {
    navigator.clipboard.writeText(ticket.ticketId);
    toast({
      title: "Copiado",
      description: ticket.ticketId,
    });
  };

  const handleZoneValidation = () => {
    if (!selectedZone) return;

    const results: ZoneValidationResult[] = [
      { status: 'ALLOW', message: 'Acceso permitido' },
      { status: 'TIME_WINDOW', message: 'Fuera de horario' },
      { status: 'CAPACITY', message: 'Zona llena' },
      { status: 'REENTRY_BLOCK', message: 'Sin reingresos' }
    ];
    
    const randomResult = results[Math.floor(Math.random() * results.length)];
    
    toast({
      title: randomResult.status === 'ALLOW' ? 'Permitido' : 'Denegado',
      description: randomResult.message,
      variant: randomResult.status === 'ALLOW' ? 'default' : 'destructive',
    });

    setZoneValidateOpen(false);
    setSelectedZone(null);
  };

  const handleRevokeTicket = () => {
    toast({
      title: "Revocado",
      description: "Ticket bloqueado",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Minimalist Header */}
      <header className="sticky top-0 z-10 bg-background p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={20} />
          </Button>
          
          {isAllowed ? (
            <CheckCircle size={24} className="text-success" />
          ) : (
            <AlertTriangle size={24} className="text-error" />
          )}
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Name and Status - Minimalist */}
        <div className="text-center py-4">
          <h1 className="text-2xl font-bold mb-2">{ticket.meta.holderName}</h1>
          <button
            onClick={copyTicketId}
            className="font-mono text-sm text-muted-foreground flex items-center gap-2 mx-auto"
          >
            {ticket.ticketId}
            <Copy size={14} />
          </button>
          <StatusBadge 
            variant={isAllowed ? 'success' : 'error'} 
            size="sm"
            className="mt-3"
          >
            {ticket.status}
          </StatusBadge>
        </div>

        {/* Gates - Simple */}
        {ticket.gateAllowlist && (
          <div className="flex justify-center gap-2">
            {ticket.gateAllowlist.map(gate => (
              <div key={gate} className="px-3 py-1 bg-muted rounded text-sm">
                {gate}
              </div>
            ))}
          </div>
        )}

        {/* Zones - Minimalist Grid */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Zonas</h2>
          <div className="grid grid-cols-2 gap-2">
            {mockEntitlements.map((entitlement) => (
              <button
                key={entitlement.zoneId}
                onClick={() => {
                  setSelectedZone(entitlement);
                  setZoneValidateOpen(true);
                }}
                className="p-3 bg-card border border-border rounded-lg text-left hover:bg-accent/10 transition-colors"
              >
                <div className="font-medium">{entitlement.zoneName}</div>
                {entitlement.timeWindow && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {entitlement.timeWindow.start}-{entitlement.timeWindow.end}
                  </div>
                )}
                {entitlement.reentryLimit > 0 && (
                  <div className="text-xs text-success mt-1">
                    {entitlement.reentryLimit - entitlement.reentryUsed} reingresos
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Actions - Minimalist */}
        <div className="grid grid-cols-2 gap-2 pt-4">
          <Button 
            variant="outline"
            onClick={() => setHistoryOpen(true)}
          >
            Historial
          </Button>
          <Button 
            variant="destructive"
            onClick={handleRevokeTicket}
            disabled={ticket.status === 'revoked'}
          >
            Revocar
          </Button>
        </div>
      </div>

      {/* History Dialog - Simplified */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Historial</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {mockHistory.slice(0, 5).map((attempt, index) => (
              <div key={index} className="flex justify-between py-2 border-b last:border-0">
                <div>
                  <div className="text-sm font-medium">{attempt.timestamp}</div>
                  <div className="text-xs text-muted-foreground">{attempt.location}</div>
                </div>
                <StatusBadge 
                  variant={attempt.result === 'ALLOW' ? 'success' : 'error'} 
                  size="sm"
                  showIcon={false}
                >
                  {attempt.result}
                </StatusBadge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Zone Validation Sheet - Simplified */}
      <Sheet open={zoneValidateOpen} onOpenChange={setZoneValidateOpen}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Validar {selectedZone?.zoneName}</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            {selectedZone && (
              <div className="space-y-4">
                {selectedZone.timeWindow && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Horario permitido</p>
                    <p className="text-lg font-medium">
                      {selectedZone.timeWindow.start} - {selectedZone.timeWindow.end}
                    </p>
                  </div>
                )}
                {selectedZone.reentryLimit > 0 && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Reingresos disponibles</p>
                    <p className="text-lg font-medium">
                      {selectedZone.reentryLimit - selectedZone.reentryUsed} de {selectedZone.reentryLimit}
                    </p>
                  </div>
                )}
              </div>
            )}
            <Button 
              className="w-full mt-6"
              onClick={handleZoneValidation}
            >
              Permitir entrada
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default TicketDetailView;