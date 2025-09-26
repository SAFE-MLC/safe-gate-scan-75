// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, User, Shield, Ticket } from "lucide-react";
 
type UserType = "client" | "staff" | null;
 
interface LoginFormData {
  ticketId: string; // Cliente
  staffId: string;  // Staff
  pin: string;      // Staff
}
 
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8082";
 
const LoginPage = () => {
  const navigate = useNavigate();
  const [selectedUserType, setSelectedUserType] = useState<UserType>(null);
  const [formData, setFormData] = useState<LoginFormData>({ ticketId: "", staffId: "", pin: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  // ---- Cliente ----
  const handleClientLogin = async () => {
    if (!formData.ticketId.trim()) {
      setError("Por favor ingresa tu ID de ticket");
      return;
    }
    setIsLoading(true);
    setError(null);
 
    try {
      const url = `${API_BASE}/api/tickets/${encodeURIComponent(formData.ticketId)}/session`;
      const response = await fetch(url);
 
      if (!response.ok) {
        // intenta leer mensaje de error del backend
        let msg = `Error ${response.status}: ${response.statusText}`;
        try {
          const data = await response.json();
          if (data?.error) msg = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
        } catch {}
        throw new Error(msg);
      }
 
      const sessionData = await response.json();
 
      localStorage.setItem(
        "ticketSession",
        JSON.stringify({
          ticketId: formData.ticketId,
          ...sessionData,
          loginType: "client",
        })
      );
 
      navigate("/attendee");
    } catch (e) {
      console.error("Client login error:", e);
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };
 
  // ---- Staff ----
  const handleStaffLogin = async () => {
    if (!formData.staffId.trim() || !formData.pin.trim()) {
      setError("Por favor ingresa Staff ID y PIN");
      return;
    }
    setIsLoading(true);
    setError(null);
 
    try {
      const url = `${API_BASE}/api/staff/login`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: formData.staffId, pin: formData.pin }),
      });
 
      if (!response.ok) {
        let msg = `Error ${response.status}: ${response.statusText}`;
        try {
          const data = await response.json();
          if (data?.error) msg = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
        } catch {}
        throw new Error(msg);
      }
 
      const staffData = await response.json();
 
      localStorage.setItem(
        "staffSession",
        JSON.stringify({
          ...staffData,
          loginType: "staff",
        })
      );
 
      navigate("/scanner");
    } catch (e) {
      console.error("Staff login error:", e);
      setError(e instanceof Error ? e.message : "Error de autenticación");
    } finally {
      setIsLoading(false);
    }
  };
 
  const resetForm = () => {
    setSelectedUserType(null);
    setFormData({ ticketId: "", staffId: "", pin: "" });
    setError(null);
  };
 
  return (
<div className="min-h-screen bg-background flex items-center justify-center p-4">
<div className="w-full max-w-md space-y-6">
        {/* Header */}
<div className="text-center">
<h1 className="text-3xl font-bold">SuperFest 2025</h1>
<p className="text-muted-foreground mt-2">Sistema de Control de Acceso</p>
</div>
 
        {/* Selección tipo de usuario */}
        {!selectedUserType && (
<Card className="p-6">
<h2 className="text-xl font-semibold text-center mb-6">Selecciona tu tipo de usuario</h2>
 
            <div className="space-y-4">
<button
                onClick={() => setSelectedUserType("client")}
                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
>
<div className="text-center">
<Ticket size={48} className="mx-auto mb-3 text-primary" />
<h3 className="text-lg font-semibold">Asistente</h3>
<p className="text-sm text-muted-foreground mt-1">Accede con tu ID de ticket para ver tu QR de entrada</p>
</div>
</button>
 
              <button
                onClick={() => setSelectedUserType("staff")}
                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
>
<div className="text-center">
<Shield size={48} className="mx-auto mb-3 text-primary" />
<h3 className="text-lg font-semibold">Personal Staff</h3>
<p className="text-sm text-muted-foreground mt-1">Acceso para personal de puertas y zonas</p>
</div>
</button>
</div>
</Card>
        )}
 
        {/* Form cliente */}
        {selectedUserType === "client" && (
<Card className="p-6">
<div className="flex items-center justify-between mb-6">
<div className="flex items-center gap-2">
<User size={20} className="text-primary" />
<h2 className="text-xl font-semibold">Acceso Asistente</h2>
</div>
<Badge variant="outline">Cliente</Badge>
</div>
 
            <div className="space-y-4">
<div>
<label className="text-sm font-medium">ID de Ticket</label>
<Input
                  type="text"
                  placeholder="Ej: TK-001"
                  value={formData.ticketId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ticketId: e.target.value }))}
                  className="mt-1"
                />
<p className="text-xs text-muted-foreground mt-1">Ingresa el ID de tu ticket para acceder</p>
</div>
 
              {error && (
<div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded">
<AlertCircle size={16} />
<span className="text-sm">{error}</span>
</div>
              )}
 
              <div className="flex gap-3">
<Button variant="outline" onClick={resetForm} className="flex-1">
                  Volver
</Button>
<Button onClick={handleClientLogin} disabled={isLoading || !formData.ticketId.trim()} className="flex-1">
                  {isLoading ? "Verificando..." : "Acceder"}
</Button>
</div>
</div>
</Card>
        )}
 
        {/* Form staff */}
        {selectedUserType === "staff" && (
<Card className="p-6">
<div className="flex items-center justify-between mb-6">
<div className="flex items-center gap-2">
<Shield size={20} className="text-primary" />
<h2 className="text-xl font-semibold">Acceso Staff</h2>
</div>
<Badge variant="outline">Personal</Badge>
</div>
 
            <div className="space-y-4">
<div>
<label className="text-sm font-medium">Staff ID</label>
<Input
                  type="text"
                  placeholder="Ej: carlos"
                  value={formData.staffId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, staffId: e.target.value }))}
                  className="mt-1"
                />
</div>
 
              <div>
<label className="text-sm font-medium">PIN</label>
<Input
                  type="password"
                  placeholder="****"
                  value={formData.pin}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pin: e.target.value }))}
                  className="mt-1"
                />
</div>
 
              {error && (
<div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded">
<AlertCircle size={16} />
<span className="text-sm">{error}</span>
</div>
              )}
 
              <div className="flex gap-3">
<Button variant="outline" onClick={resetForm} className="flex-1">
                  Volver
</Button>
<Button
                  onClick={handleStaffLogin}
                  disabled={isLoading || !formData.staffId.trim() || !formData.pin.trim()}
                  className="flex-1"
>
                  {isLoading ? "Autenticando..." : "Ingresar"}
</Button>
</div>
</div>
</Card>
        )}
 
        <div className="text-center text-sm text-muted-foreground">
<p>SuperFest 2025 - Sistema SAFE</p>
</div>
</div>
</div>
  );
};
 
export default LoginPage;