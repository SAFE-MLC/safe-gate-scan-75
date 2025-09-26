// src/hooks/useRotatingQR.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { BackofficeService, SessionInfo } from '../services/BackofficeService';
import { JWTService } from '../services/JWTService';

export interface QRState {
  currentJWT: string;
  timeRemaining: number;
  isOnline: boolean;
  lastSync: Date | null;
  error: string | null;
  isLoading: boolean;
}
export interface QRConfig {
  ticketId: string;
  eventId: string;
  backofficeUrl: string;   // p.ej. "/api"
  qrTtlSeconds?: number;
  syncIntervalMs?: number;
  clockSkewSeconds?: number;
}

export const useRotatingQR = (config: QRConfig | null) => {
  if (!config) {
    return {
      currentJWT: '',
      timeRemaining: 20,
      isOnline: false,
      lastSync: null,
      error: null,
      isLoading: true,
      retry: async () => {},
      forceRotate: async () => {},
      sessionInfo: null,
    };
  }

  const { ticketId, eventId, backofficeUrl, qrTtlSeconds = 20, syncIntervalMs = 60000, clockSkewSeconds = 0 } = config;

  const [state, setState] = useState<QRState>({
    currentJWT: '',
    timeRemaining: qrTtlSeconds,
    isOnline: false,
    lastSync: null,
    error: null,
    isLoading: true,
  });
  const [sessionReady, setSessionReady] = useState(false); // 👈 dispara efectos

  const sessionInfoRef = useRef<SessionInfo | null>(null);
  const rotationIntervalRef = useRef<number | null>(null); // 👈 number en browser
  const syncIntervalRef = useRef<number | null>(null);

  const backofficeService = useRef(new BackofficeService({ baseUrl: backofficeUrl }));
  const jwtService = useRef(new JWTService());

  const fetchSession = useCallback(async (): Promise<boolean> => {
    try {
      const sessionInfo = await backofficeService.current.getTicketSession(ticketId);
      sessionInfoRef.current = sessionInfo;
      setState(p => ({ ...p, error: null, isOnline: true, lastSync: new Date(), isLoading: false }));
      setSessionReady(true);
      return true;
    } catch (e: any) {
      setState(p => ({ ...p, error: `Error de conexión: ${e?.message ?? 'desconocido'}`, isOnline: false, isLoading: false }));
      setSessionReady(false);
      return false;
    }
  }, [ticketId]);

  const generateNewJWT = useCallback(async (): Promise<string | null> => {
    const s = sessionInfoRef.current;
    if (!s) return null;
    try {
      const jwt = await jwtService.current.createRotatingQR(
        ticketId,
        eventId,
        s.sessionKey,          // 👈 usa camelCase
        qrTtlSeconds,
        clockSkewSeconds
      );
      setState(p => ({ ...p, currentJWT: jwt, timeRemaining: qrTtlSeconds, error: null }));
      return jwt;
    } catch (e: any) {
      setState(p => ({ ...p, error: e?.message ?? 'Error generando QR' }));
      return null;
    }
  }, [ticketId, eventId, qrTtlSeconds, clockSkewSeconds]);

  // init
  useEffect(() => {
    (async () => {
      const ok = await fetchSession();
      if (ok) await generateNewJWT();
    })();
  }, [fetchSession, generateNewJWT]);

  // timer de rotación (arranca cuando hay sesión)
  useEffect(() => {
    if (!sessionReady) return;
    if (rotationIntervalRef.current !== null) clearInterval(rotationIntervalRef.current);

    rotationIntervalRef.current = window.setInterval(() => {
      setState(prev => {
        const t = prev.timeRemaining - 1;
        if (t <= 0) {
          setTimeout(() => { void generateNewJWT(); }, 0);
          return { ...prev, timeRemaining: qrTtlSeconds };
        }
        return { ...prev, timeRemaining: t };
      });
    }, 1000);

    return () => {
      if (rotationIntervalRef.current !== null) {
        clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }
    };
  }, [sessionReady, generateNewJWT, qrTtlSeconds]);

  // sync periódico
  useEffect(() => {
    if (syncIntervalRef.current !== null) clearInterval(syncIntervalRef.current);
    syncIntervalRef.current = window.setInterval(async () => {
      if (state.isOnline) {
        await fetchSession();
        // opcional: rotación hard post-sync
        // await generateNewJWT();
      }
    }, syncIntervalMs);
    return () => {
      if (syncIntervalRef.current !== null) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [state.isOnline, fetchSession, syncIntervalMs]);

  const retry = useCallback(async () => {
    setState(p => ({ ...p, error: null, isLoading: true }));
    const ok = await fetchSession();
    if (ok) await generateNewJWT();
  }, [fetchSession, generateNewJWT]);

  const forceRotate = useCallback(async () => {
    await generateNewJWT();
  }, [generateNewJWT]);

  useEffect(() => () => {
    if (rotationIntervalRef.current !== null) clearInterval(rotationIntervalRef.current);
    if (syncIntervalRef.current !== null) clearInterval(syncIntervalRef.current);
  }, []);

  return { ...state, retry, forceRotate, sessionInfo: sessionInfoRef.current };
};
