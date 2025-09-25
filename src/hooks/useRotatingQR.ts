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
  backofficeUrl: string;
  qrTtlSeconds?: number;
  syncIntervalMs?: number;
  clockSkewSeconds?: number;
}

export const useRotatingQR = (config: QRConfig) => {
  const {
    ticketId,
    eventId,
    backofficeUrl,
    qrTtlSeconds = 20,
    syncIntervalMs = 60000,
    clockSkewSeconds = 0
  } = config;

  const [state, setState] = useState<QRState>({
    currentJWT: '',
    timeRemaining: qrTtlSeconds,
    isOnline: false,
    lastSync: null,
    error: null,
    isLoading: true
  });

  const sessionInfoRef = useRef<SessionInfo | null>(null);
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Servicios
  const backofficeService = useRef(new BackofficeService({ baseUrl: backofficeUrl }));
  const jwtService = useRef(new JWTService());

  // Función para obtener nueva sesión
  const fetchSession = useCallback(async (): Promise<boolean> => {
    try {
      const sessionInfo = await backofficeService.current.getTicketSession(ticketId);
      sessionInfoRef.current = sessionInfo;
      
      setState(prev => ({
        ...prev,
        error: null,
        isOnline: true,
        lastSync: new Date(),
        isLoading: false
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({
        ...prev,
        error: `Error de conexión: ${errorMessage}`,
        isOnline: false,
        isLoading: false
      }));
      return false;
    }
  }, [ticketId]);

  // Función para generar nuevo JWT
  const generateNewJWT = useCallback(async (): Promise<string | null> => {
    if (!sessionInfoRef.current) return null;

    try {
      const jwt = await jwtService.current.createRotatingQR(
        ticketId,
        eventId,
        sessionInfoRef.current.session_key,
        qrTtlSeconds,
        clockSkewSeconds
      );
      
      setState(prev => ({
        ...prev,
        currentJWT: jwt,
        timeRemaining: qrTtlSeconds,
        error: null
      }));
      
      return jwt;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error generando QR';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
      return null;
    }
  }, [ticketId, eventId, qrTtlSeconds, clockSkewSeconds]);

  // Inicialización
  useEffect(() => {
    const initialize = async () => {
      const success = await fetchSession();
      if (success) {
        await generateNewJWT();
      }
    };

    initialize();
  }, [fetchSession, generateNewJWT]);

  // Timer de rotación de QR
  useEffect(() => {
    if (!sessionInfoRef.current) return;

    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
    }

    rotationIntervalRef.current = setInterval(() => {
      setState(prev => {
        const newTimeRemaining = prev.timeRemaining - 1;
        
        if (newTimeRemaining <= 0) {
          // Regenerar QR en el próximo tick
          setTimeout(() => generateNewJWT(), 0);
          return { ...prev, timeRemaining: qrTtlSeconds };
        }
        
        return { ...prev, timeRemaining: newTimeRemaining };
      });
    }, 1000);

    return () => {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
      }
    };
  }, [sessionInfoRef.current, generateNewJWT, qrTtlSeconds]);

  // Timer de sincronización
  useEffect(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    syncIntervalRef.current = setInterval(async () => {
      if (state.isOnline) {
        await fetchSession();
      }
    }, syncIntervalMs);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [state.isOnline, fetchSession, syncIntervalMs]);

  // Función para reintentar conexión
  const retry = useCallback(async () => {
    setState(prev => ({ ...prev, error: null, isLoading: true }));
    const success = await fetchSession();
    if (success) {
      await generateNewJWT();
    }
  }, [fetchSession, generateNewJWT]);

  // Función para forzar rotación
  const forceRotate = useCallback(async () => {
    await generateNewJWT();
  }, [generateNewJWT]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    retry,
    forceRotate,
    sessionInfo: sessionInfoRef.current
  };
};