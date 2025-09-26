// src/services/BackofficeService.ts

export interface SessionInfo {
  ticketId: string;
  session_key: string;
  exp: number;
}

export interface BackofficeConfig {
  baseUrl: string;
  timeout?: number;
}

export class BackofficeService {
  private config: BackofficeConfig;

  constructor(config: BackofficeConfig) {
    this.config = {
      timeout: 5000,
      ...config
    };
  }

  /**
   * Obtiene información de sesión del Backoffice
   */
  async getTicketSession(ticketId: string): Promise<SessionInfo> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(
        `/api/tickets/session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId }),
          signal: controller.signal
        }
      );


      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: SessionInfo = await response.json();
      
      // Validar la respuesta
      if (!data.ticketId || !data.session_key || !data.exp) {
        throw new Error('Respuesta inválida del servidor');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Timeout de conexión');
        }
        throw error;
      }
      throw new Error('Error desconocido');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Verifica la conectividad con el Backoffice
   */
  async ping(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}