// src/pages/StaffScannerView.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, Flashlight, FlashlightOff, Keyboard, LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import ConnectivityChip from "@/components/ConnectivityChip";
import ValidationToast from "@/components/ValidationToast";
import { mockDevice } from "@/data/mockData";
import { ValidationResult } from "@/types";

interface StaffData {
  staffId: string;
  displayName: string;
  role: 'GATE' | 'ZONE';
  gateId?: string;
  zoneCheckpointId?: string;
}

interface ScanResult {
  decision: 'ALLOW' | 'DENY';
  ticketId?: string;
  entitlements?: string[];
  reason?: string;
}

const StaffScannerView = () => {
  const navigate = useNavigate();
  const [staffData, setStaffData] = useState<StaffData | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [manualCodeOpen, setManualCodeOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Load staff data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('staffSession');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setStaffData(data);
      } catch (error) {
        console.error('Error parsing staff session:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Handle QR scan
  const handleScan = async (qrCode: string) => {
    if (!staffData || isScanning) return;
    
    setIsScanning(true);
    console.log(`🔍 Staff ${staffData.role} escaneando QR:`, qrCode.substring(0, 50) + '...');

    try {
      let endpoint = '';
      let payload: any = {};

      if (staffData.role === 'GATE') {
        // Gate validation
        endpoint = 'http://localhost:8080/validate/scan';
        payload = {
          qr: qrCode,
          gateId: staffData.gateId
        };
      } else if (staffData.role === 'ZONE') {
        // Zone validation
        endpoint = 'http://localhost:8080/zones/checkpoint/scan';
        payload = {
          qr: qrCode,
          zoneCheckpointId: staffData.zoneCheckpointId
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result: ScanResult = await response.json();
      
      // Convert to ValidationResult format
      let validationStatus: ValidationResult['status'];
      let message: string;

      if (result.decision === 'ALLOW') {
        validationStatus = 'ALLOW';
        message = staffData.role === 'GATE' ? 'Acceso permitido a puerta' : 'Acceso permitido a zona';
      } else {
        // Map different deny reasons
        switch (result.reason) {
          case 'EXPIRED':
          case 'INVALID':
            validationStatus = 'DENY-REVOKED';
            message = 'QR expirado o inválido';
            break;
          case 'USED':
            validationStatus = 'DENY-DUPLICATE';
            message = 'Ticket ya utilizado';
            break;
          case 'NOT_FOUND':
            validationStatus = 'DENY-GATE';
            message = 'Ticket no encontrado';
            break;
          case 'NO_ENTITLEMENT':
            validationStatus = 'DENY-GATE';
            message = 'Sin permisos para esta zona';
            break;
          default:
            validationStatus = 'DENY-REVOKED';
            message = result.reason || 'Acceso denegado';
        }
      }

      setValidationResult({ status: validationStatus, message });

      // Navigate to ticket detail if successful
      if (result.decision === 'ALLOW' && result.ticketId) {
        setTimeout(() => {
          navigate(`/ticket/${result.ticketId}`);
        }, 1500);
      }

    } catch (error) {
      console.error('Error validating scan:', error);
      setValidationResult({ 
        status: 'WARN-OFFLINE', 
        message: 'Error de conexión - Modo offline' 
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualSubmit = () => {
    if (manualCode) {
      handleScan(manualCode);
      setManualCodeOpen(false);
      setManualCode("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('staffSession');
    navigate('/login');
  };

  if (!staffData) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Staff Info */}
      <header className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {staffData.role === 'GATE' ? (
                <Shield size={24} className="text-blue-600" />
              ) : (
                <User size={24} className="text-green-600" />
              )}
              <div>
                <h1 className="text-lg font-bold">{staffData.displayName}</h1>
                <p className="text-sm text-muted-foreground">
                  {staffData.role === 'GATE' ? `Puerta: ${staffData.gateId}` : `Zona: ${staffData.zoneCheckpointId}`}
                </p>
              </div>
            </div>
            <Badge 
              variant={staffData.role === 'GATE' ? 'default' : 'secondary'}
              className="ml-2"
            >
              {staffData.role === 'GATE' ? 'GATE STAFF' : 'ZONE STAFF'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <ConnectivityChip 
              online={mockDevice.online} 
              clockDriftSec={mockDevice.clockDriftSec}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      {/* Scanner Area */}
      <div className="flex-1 relative flex items-center justify-center p-6">
        <div className="relative w-full max-w-sm aspect-square">
          {/* Scanner Frame */}
          <div className="absolute inset-0 border border-primary/30 rounded-lg">
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary" />
          </div>
          
          {/* QR Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <QrCode 
              size={64} 
              className={`text-muted-foreground/30 ${isScanning ? 'animate-pulse' : ''}`} 
            />
          </div>

          {/* Scanning indicator */}
          {isScanning && (
            <div className="absolute inset-0 border-2 border-yellow-400 rounded-lg animate-pulse">
              <div className="absolute inset-0 bg-yellow-400/10 rounded-lg" />
            </div>
          )}

          {/* Instructions */}
          <div className="absolute -bottom-16 left-0 right-0 text-center">
            <p className="text-sm text-muted-foreground">
              {isScanning ? 'Validando QR...' : 'Enfoca el QR del asistente'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
          {/* Flashlight */}
          <button
            className="p-4 bg-background border rounded-full shadow-sm"
            onClick={() => setFlashlightOn(!flashlightOn)}
          >
            {flashlightOn ? 
              <FlashlightOff size={24} className="text-yellow-500" /> : 
              <Flashlight size={24} className="text-gray-400" />
            }
          </button>

          {/* Manual Input */}
          <button
            className="p-4 bg-background border rounded-full shadow-sm"
            onClick={() => setManualCodeOpen(true)}
          >
            <Keyboard size={24} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Status Section */}
      <div className="p-4 border-t bg-muted/50">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium">Sistema activo</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {staffData.role === 'GATE' 
              ? 'Escaneando tickets para validación de entrada' 
              : 'Escaneando tickets para control de zonas'
            }
          </p>
        </div>
      </div>

      {/* Manual Code Dialog */}
      <Dialog open={manualCodeOpen} onOpenChange={setManualCodeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingreso Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Pega aquí el código QR..."
              className="font-mono text-sm"
            />
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setManualCodeOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleManualSubmit}
                disabled={!manualCode}
                className="flex-1"
              >
                Validar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Validation Toast */}
      {validationResult && (
        <ValidationToast
          result={validationResult}
          onClose={() => setValidationResult(null)}
        />
      )}
    </div>
  );
};

export default StaffScannerView;