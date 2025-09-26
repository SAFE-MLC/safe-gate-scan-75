// src/pages/StaffScannerView.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, Flashlight, FlashlightOff, Keyboard, LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import ConnectivityChip from "@/components/ConnectivityChip";
import ValidationToast from "@/components/ValidationToast";
import { mockDevice } from "@/data/mockData";
import { ValidationResult } from "@/types";
 
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8082";
 
interface StaffData {
  staffId: string;
  displayName: string;
  role: "GATE" | "ZONE";
  gateId?: string;
  zoneCheckpointId?: string;
}
 
type DenyReason =
  | "EXPIRED|INVALID"
  | "INVALID"
  | "NOT_FOUND"
  | "USED"
  | "NO_ENTITLEMENT"
  | "BAD_REQUEST";
 
interface ScanResult {
  decision: "ALLOW" | "DENY";
  ticketId?: string;          // solo GATE OK
  entitlements?: string[];    // solo GATE OK
  reason?: DenyReason;
}
 
const StaffScannerView = () => {
  const navigate = useNavigate();
  const [staffData, setStaffData] = useState<StaffData | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [manualCodeOpen, setManualCodeOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
 
  useEffect(() => {
    const stored = localStorage.getItem("staffSession");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setStaffData(data);
      } catch {
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);
 
  const mapResultToValidation = (role: "GATE" | "ZONE", res: ScanResult): ValidationResult => {
    if (res.decision === "ALLOW") {
      return {
        status: "ALLOW",
        message: role === "GATE" ? "Acceso permitido a puerta" : "Acceso permitido a zona",
      };
    }
    switch (res.reason) {
      case "EXPIRED|INVALID":
      case "INVALID":
        return { status: "DENY-REVOKED", message: "QR expirado o inválido" };
      case "USED":
        return { status: "DENY-DUPLICATE", message: "Ticket ya utilizado" };
      case "NOT_FOUND":
        return { status: "DENY-GATE", message: "No encontrado (ticket/checkpoint)" };
      case "NO_ENTITLEMENT":
        return { status: "DENY-GATE", message: "Sin permisos para esta zona" };
      case "BAD_REQUEST":
        return { status: "DENY-REVOKED", message: "Solicitud inválida" };
      default:
        return { status: "DENY-REVOKED", message: res.reason || "Acceso denegado" };
    }
  };
 
  const handleScan = async (qrCode: string) => {
    if (!staffData || isScanning) return;
    setIsScanning(true);
 
    try {
      let endpoint = "";
      let payload: Record<string, unknown> = {};
 
      if (staffData.role === "GATE") {
        endpoint = `${API_BASE}/validate/scan`;
        payload = { qr: qrCode, gateId: staffData.gateId };
      } else {
        endpoint = `${API_BASE}/zones/checkpoint/scan`;
        payload = { qr: qrCode, zoneCheckpointId: staffData.zoneCheckpointId };
      }
 
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
 
      const data = (await resp.json()) as Partial<ScanResult> & { error?: string };
      const result: ScanResult =
        "decision" in data && data.decision ? (data as ScanResult) : { decision: "DENY", reason: "INVALID" };
 
      const vr = mapResultToValidation(staffData.role, result);
      setValidationResult(vr);
 
      if (result.decision === "ALLOW" && result.ticketId) {
        setTimeout(() => navigate(`/ticket/${result.ticketId}`), 1200);
      }
    } catch (e) {
      console.error("Error validating scan:", e);
      setValidationResult({ status: "WARN-OFFLINE", message: "Error de conexión - Modo offline" });
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
    localStorage.removeItem("staffSession");
    navigate("/login");
  };
 
  if (!staffData) return <div>Cargando...</div>;
 
  return (
<div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
<header className="p-4 border-b">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="flex items-center gap-2">
              {staffData.role === "GATE" ? (
<Shield size={24} className="text-blue-600" />
              ) : (
<User size={24} className="text-green-600" />
              )}
<div>
<h1 className="text-lg font-bold">{staffData.displayName}</h1>
<p className="text-sm text-muted-foreground">
                  {staffData.role === "GATE"
                    ? `Puerta: ${staffData.gateId}`
                    : `Checkpoint: ${staffData.zoneCheckpointId}`}
</p>
</div>
</div>
<Badge variant={staffData.role === "GATE" ? "default" : "secondary"} className="ml-2">
              {staffData.role === "GATE" ? "GATE STAFF" : "ZONE STAFF"}
</Badge>
</div>
 
          <div className="flex items-center gap-3">
<ConnectivityChip online={mockDevice.online} clockDriftSec={mockDevice.clockDriftSec} />
<Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
<LogOut size={20} />
</Button>
</div>
</div>
</header>
 
      {/* Scanner */}
<div className="flex-1 relative flex items-center justify-center p-6">
<div className="relative w-full max-w-sm aspect-square">
<div className="absolute inset-0 border border-primary/30 rounded-lg">
<div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
<div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary" />
<div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary" />
<div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary" />
</div>
 
          <div className="absolute inset-0 flex items-center justify-center">
<QrCode size={64} className={`text-muted-foreground/30 ${isScanning ? "animate-pulse" : ""}`} />
</div>
 
          {isScanning && (
<div className="absolute inset-0 border-2 border-yellow-400 rounded-lg animate-pulse">
<div className="absolute inset-0 bg-yellow-400/10 rounded-lg" />
</div>
          )}
 
          <div className="absolute -bottom-16 left-0 right-0 text-center">
<p className="text-sm text-muted-foreground">
              {isScanning ? "Validando QR..." : "Enfoca el QR del asistente"}
</p>
</div>
</div>
 
        {/* Controls */}
<div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
<button className="p-4 bg-background border rounded-full shadow-sm" onClick={() => setFlashlightOn(!flashlightOn)}>
            {flashlightOn ? <FlashlightOff size={24} className="text-yellow-500" /> : <Flashlight size={24} className="text-gray-400" />}
</button>
 
          <button className="p-4 bg-background border rounded-full shadow-sm" onClick={() => setManualCodeOpen(true)}>
<Keyboard size={24} className="text-gray-400" />
</button>
</div>
</div>
 
      {/* Footer */}
<div className="p-4 border-t bg-muted/50">
<div className="text-center space-y-2">
<div className="flex items-center justify-center gap-2">
<div className="w-2 h-2 rounded-full bg-green-500" />
<span className="text-sm font-medium">Sistema activo</span>
</div>
<p className="text-xs text-muted-foreground">
            {staffData.role === "GATE"
              ? "Escaneando tickets para validación de entrada"
              : "Escaneando tickets para control de zonas"}
</p>
</div>
</div>
 
      {/* Manual dialog */}
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
<Button variant="outline" onClick={() => setManualCodeOpen(false)} className="flex-1">
                Cancelar
</Button>
<Button onClick={handleManualSubmit} disabled={!manualCode} className="flex-1">
                Validar
</Button>
</div>
</div>
</DialogContent>
</Dialog>
 
      {validationResult && <ValidationToast result={validationResult} onClose={() => setValidationResult(null)} />}
</div>
  );
};
 
export default StaffScannerView;