import { Ticket, Entitlement, ZonePolicy, Device, Gate, HistoryAttempt } from '@/types';

export const mockTicket: Ticket = {
  ticketId: "TK-001",
  eventId: "EV-123",
  status: "active",
  gateAllowlist: ["G-SUR", "G-NORTE"],
  meta: { 
    holderName: "Ana María Gómez", 
    email: "ana@example.com" 
  },
  lastAttempt: { 
    ts: "19:21:05", 
    result: "ALLOW", 
    gateId: "G-SUR" 
  }
};

export const mockEntitlements: Entitlement[] = [
  { 
    zoneId: "Z-VIP", 
    zoneName: "VIP", 
    reentryLimit: 1, 
    reentryUsed: 0, 
    timeWindow: { start: "18:00", end: "22:00" } 
  },
  { 
    zoneId: "Z-BSTG", 
    zoneName: "Backstage", 
    reentryLimit: 0, 
    reentryUsed: 0,
    timeWindow: null 
  },
  { 
    zoneId: "Z-PRESS", 
    zoneName: "Prensa", 
    reentryLimit: 3, 
    reentryUsed: 1,
    timeWindow: { start: "17:00", end: "23:00" } 
  }
];

export const mockZonePolicies: ZonePolicy[] = [
  { 
    zoneId: "Z-VIP", 
    capacityLimit: 100, 
    occupied: 75, 
    reentryPolicy: "single", 
    timeWindow: { start: "18:00", end: "23:00" } 
  }
];

export const mockDevice: Device = { 
  id: "SCN-42", 
  online: true, 
  cfgVersion: 27, 
  clockDriftSec: 5 
};

export const mockGate: Gate = { 
  id: "G-SUR", 
  name: "Sur" 
};

export const mockHistory: HistoryAttempt[] = [
  { timestamp: "19:21:05", location: "G-SUR", result: "ALLOW", reason: "Acceso permitido" },
  { timestamp: "18:45:12", location: "Z-VIP", result: "ALLOW", reason: "Entrada a zona VIP" },
  { timestamp: "17:30:00", location: "G-NORTE", result: "DENY-GATE", reason: "Puerta no permitida" },
  { timestamp: "16:15:30", location: "G-SUR", result: "ALLOW", reason: "Primer ingreso" },
  { timestamp: "15:00:00", location: "Z-PRESS", result: "TIME_WINDOW", reason: "Fuera de horario" }
];