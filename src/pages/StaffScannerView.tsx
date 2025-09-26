// src/pages/StaffScannerView.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Flashlight, FlashlightOff, Keyboard, LogOut, User, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import ConnectivityChip from "@/components/ConnectivityChip";
import ValidationToast from "@/components/ValidationToast";
import { mockDevice } from "@/data/mockData";
import { ValidationResult } from "@/types";
import QRScanner from "@/components/QRScanner";

interface StaffData {
  staffId: string;
  displayName: string;
  role: "GATE" | "ZONE";
  gateId?: string;
  zoneCheckpointId?: string;
}

/** 👇 Incluye NO_GATE_ENTRY y acepta otros estados como string genérico */
type DenyReason =
  | "EXPIRED|INVALID"
  | "INVALID"
  | "NOT_FOUND"
  | "USED"
  | "NO_ENTITLEMENT"
  | "BAD_REQUEST"
  | "NO_GATE_ENTRY"
  | string;

interface ScanResult {
  decision: "ALLOW" | "DENY";
  ticketId?: string;
  entitlements?: string[];
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

  // referencia al <video> del scanner para controlar torch
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // fallback “screen torch”
  const [screenTorchOn, setScreenTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState<boolean | null>(null);

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

  /** 👇 Mensajes más precisos para todas las razones posibles */
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
        // si llegara desde gate o se reusa en zona
        return { status: "DENY-DUPLICATE", message: "Ticket ya utilizado" };

      case "NOT_FOUND":
        return { status: "DENY-GATE", message: role === "GATE" ? "Ticket no encontrado" : "Checkpoint o ticket no encontrado" };

      case "NO_ENTITLEMENT":
        return { status: "DENY-GATE", message: "Sin permisos para esta zona" };

      case "BAD_REQUEST":
        return { status: "DENY-REVOKED", message: "Solicitud inválida" };

      case "NO_GATE_ENTRY":
        // viene de zona-ms cuando t.status !== 'USED'
        return { status: "DENY-GATE", message: "Debes ingresar por la puerta primero" };

      default:
        // otros estados que puedan llegar como reason (p.ej. RAW status)
        return { status: "DENY-REVOKED", message: String(res.reason || "Acceso denegado") };
    }
  };

  const handleScan = async (qrCode: string) => {
    if (!staffData || isScanning) return;
    setIsScanning(true);

    try {
      let endpoint = "";
      let payload: Record<string, unknown> = {};

      if (staffData.role === "GATE") {
        endpoint = `/api/gate/validate/scan`;
        payload = { qr: qrCode, gateId: staffData.gateId };
      } else {
        endpoint = `/api/zone/zones/checkpoint/scan`;
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

      // ya no navegamos, solo feedback visual
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

  /** Torch: intenta hardware torch; si no, activa fallback (pantalla blanca) */
  const toggleFlashlight = async () => {
    try {
      const video = videoRef.current;
      const stream = video?.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks?.()[0];

      if (!track) {
        console.warn("No video track found for torch control");
        setTorchSupported(false);
        setScreenTorchOn((v) => !v); // fallback
        setFlashlightOn((v) => !v);
        return;
      }

      // capacidades del track
      const caps: any = (track.getCapabilities && track.getCapabilities()) || {};
      const canTorch = "torch" in caps && caps.torch === true;

      if (!canTorch) {
        console.warn("Torch not supported on this device/browser");
        setTorchSupported(false);
        setScreenTorchOn((v) => !v); // fallback
        setFlashlightOn((v) => !v);
        return;
      }

      // soporta torch
      setTorchSupported(true);
      const newValue = !flashlightOn;
      await track.applyConstraints({ advanced: [{ torch: newValue }] as any });
      setFlashlightOn(newValue);

      // Si apagamos el torch HW, apaga el fallback si estaba activo
      if (!newValue && screenTorchOn) setScreenTorchOn(false);
    } catch (err) {
      console.error("Torch toggle failed:", err);
      // en error, usar fallback
      setTorchSupported(false);
      setScreenTorchOn((v) => !v);
      setFlashlightOn((v) => !v);
    }
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
        <QRScanner
          onCode={(qr) => handleScan(qr)}
          onVideoRef={(v) => {
            videoRef.current = v;
            // Detecta soporte de torch una vez tengamos el video
            try {
              const track = (v?.srcObject as MediaStream | null)?.getVideoTracks?.()[0];
              const caps: any = track?.getCapabilities?.() || {};
              setTorchSupported("torch" in caps && caps.torch === true);
            } catch {
              setTorchSupported(false);
            }
          }}
        />

        {/* Controls */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
          <button
            className="p-4 bg-background border rounded-full shadow-sm"
            onClick={toggleFlashlight}
            title={torchSupported ? "Linterna (hardware)" : "Linterna (pantalla)"}
          >
            {flashlightOn ? (
              <FlashlightOff size={24} className="text-yellow-500" />
            ) : (
              <Flashlight size={24} className="text-gray-400" />
            )}
          </button>

          <button
            className="p-4 bg-background border rounded-full shadow-sm"
            onClick={() => setManualCodeOpen(true)}
            title="Ingresar código manual"
          >
            <Keyboard size={24} className="text-gray-400" />
          </button>
        </div>

        {/* 🟡 Fallback: pantalla blanca como linterna */}
        {screenTorchOn && (
          <div className="fixed inset-0 bg-white z-50">
            <div className="absolute top-4 right-4">
              <Button variant="outline" onClick={() => { setScreenTorchOn(false); setFlashlightOn(false); }}>
                <X className="w-4 h-4 mr-1" /> Cerrar linterna
              </Button>
            </div>
          </div>
        )}
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

      {validationResult && (
        <ValidationToast result={validationResult} onClose={() => setValidationResult(null)} />
      )}
    </div>
  );
};

export default StaffScannerView;
