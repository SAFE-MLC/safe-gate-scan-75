import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, Flashlight, FlashlightOff, Keyboard, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConnectivityChip from "@/components/ConnectivityChip";
import ValidationToast from "@/components/ValidationToast";
import { mockDevice, mockGate } from "@/data/mockData";
import { ValidationResult } from "@/types";

const ScannerView = () => {
  const navigate = useNavigate();
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [manualCodeOpen, setManualCodeOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [selectedGate, setSelectedGate] = useState(mockGate);

  const handleScan = (code: string) => {
    const results: ValidationResult[] = [
      { status: 'ALLOW', message: 'Acceso permitido' },
      { status: 'DENY-REVOKED', message: 'Ticket revocado' },
      { status: 'DENY-DUPLICATE', message: 'Duplicado' },
      { status: 'DENY-GATE', message: 'Puerta incorrecta' },
      { status: 'WARN-OFFLINE', message: 'Modo offline' }
    ];
    
    const randomResult = results[Math.floor(Math.random() * results.length)];
    setValidationResult(randomResult);

    if (randomResult.status === 'ALLOW' || randomResult.status === 'WARN-OFFLINE') {
      setTimeout(() => {
        navigate('/ticket/TK-001');
      }, 1000);
    }
  };

  const handleManualSubmit = () => {
    if (manualCode) {
      handleScan(manualCode);
      setManualCodeOpen(false);
      setManualCode("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimalist Header */}
      <header className="p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedGate(prev => ({
              ...prev,
              id: prev.id === 'G-SUR' ? 'G-NORTE' : 'G-SUR',
              name: prev.id === 'G-SUR' ? 'Norte' : 'Sur'
            }))}
            className="text-2xl font-bold"
          >
            {selectedGate.id}
          </button>
          
          <div className="flex items-center gap-3">
            <ConnectivityChip 
              online={mockDevice.online} 
              clockDriftSec={mockDevice.clockDriftSec}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/attendee')}
            >
              <Users size={20} />
            </Button>
          </div>
        </div>
      </header>

      {/* Scanner Area */}
      <div className="flex-1 relative flex items-center justify-center p-6">
        <div className="relative w-full max-w-sm aspect-square">
          {/* Minimalist Scanner Frame */}
          <div className="absolute inset-0 border border-primary/30 rounded-lg">
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary" />
          </div>
          
          {/* QR Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <QrCode size={48} className="text-muted-foreground/30" />
          </div>

          {/* Flashlight */}
          <button
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 p-3"
            onClick={() => setFlashlightOn(!flashlightOn)}
          >
            {flashlightOn ? 
              <Flashlight size={24} className="text-primary" /> : 
              <FlashlightOff size={24} className="text-muted-foreground" />
            }
          </button>
        </div>

        {/* Demo scan button */}
        <Button
          className="absolute top-2 right-2"
          onClick={() => handleScan('DEMO')}
          variant="ghost"
          size="sm"
        >
          Test
        </Button>
      </div>

      {/* Bottom Action */}
      <div className="p-6">
        <button
          onClick={() => setManualCodeOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-4 text-muted-foreground"
        >
          <Keyboard size={20} />
          <span>Manual</span>
        </button>
      </div>

      {/* Manual Code Dialog */}
      <Dialog open={manualCodeOpen} onOpenChange={setManualCodeOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Código manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="TK-000"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="text-center text-lg font-mono"
              autoFocus
            />
            <Button onClick={handleManualSubmit} className="w-full">
              Validar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Validation Toast */}
      <ValidationToast 
        result={validationResult} 
        onClose={() => setValidationResult(null)}
      />
    </div>
  );
};

export default ScannerView;