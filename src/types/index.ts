export interface Ticket {
  ticketId: string;
  eventId: string;
  status: 'active' | 'revoked' | 'expired';
  gateAllowlist?: string[];
  meta: {
    holderName: string;
    email?: string;
  };
  lastAttempt?: {
    ts: string;
    result: string;
    gateId: string;
  };
}

export interface Entitlement {
  zoneId: string;
  zoneName: string;
  reentryLimit: number;
  reentryUsed: number;
  timeWindow?: {
    start: string;
    end: string;
  } | null;
}

export interface ZonePolicy {
  zoneId: string;
  capacityLimit: number;
  occupied: number;
  reentryPolicy: string;
  timeWindow?: {
    start: string;
    end: string;
  };
}

export interface Device {
  id: string;
  online: boolean;
  cfgVersion: number;
  clockDriftSec: number;
}

export interface Gate {
  id: string;
  name: string;
}

export interface ValidationResult {
  status: 'ALLOW' | 'DENY-REVOKED' | 'DENY-DUPLICATE' | 'DENY-GATE' | 'WARN-OFFLINE';
  message: string;
}

export interface ZoneValidationResult {
  status: 'ALLOW' | 'NO_ENTITLEMENT' | 'TIME_WINDOW' | 'CAPACITY' | 'REENTRY_BLOCK';
  message: string;
}

export interface HistoryAttempt {
  timestamp: string;
  location: string;
  result: string;
  reason?: string;
}