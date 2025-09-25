// src/services/JWTService.ts

export interface JWTPayload {
  sub: string;    // ticketId
  tid: string;    // ticketId (redundante por claridad)
  evt: string;    // eventId
  iat: number;    // issued at (epoch seconds)
  exp: number;    // expires (epoch seconds)
}

export interface JWTHeader {
  alg: string;
  typ: string;
}

export class JWTService {
  /**
   * Codifica datos en Base64URL
   */
  private base64UrlEncode(data: any): string {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    return btoa(jsonString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Genera HMAC-SHA256 signature
   */
  private async hmacSha256(message: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Genera un JWT firmado con HS256
   */
  async generateJWT(payload: JWTPayload, secret: string): Promise<string> {
    const header: JWTHeader = { 
      alg: 'HS256', 
      typ: 'JWT' 
    };

    const encodedHeader = this.base64UrlEncode(header);
    const encodedPayload = this.base64UrlEncode(payload);
    
    const message = `${encodedHeader}.${encodedPayload}`;
    const signature = await this.hmacSha256(message, secret);
    
    return `${message}.${signature}`;
  }

  /**
   * Crea un JWT rotativo para QR
   */
  async createRotatingQR(
    ticketId: string, 
    eventId: string, 
    sessionKey: string, 
    ttlSeconds: number = 20,
    skewSeconds: number = 0
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    
    const payload: JWTPayload = {
      sub: ticketId,
      tid: ticketId,
      evt: eventId,
      iat: now - skewSeconds,
      exp: now + ttlSeconds
    };

    return this.generateJWT(payload, sessionKey);
  }

  /**
   * Decodifica un JWT (sin verificar signature)
   * Útil para debugging
   */
  decodeJWT(jwt: string): { header: JWTHeader, payload: JWTPayload } | null {
    try {
      const [encodedHeader, encodedPayload] = jwt.split('.');
      
      const header = JSON.parse(atob(encodedHeader.replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')));
      
      return { header, payload };
    } catch {
      return null;
    }
  }

  /**
   * Verifica si un JWT está expirado
   */
  isExpired(jwt: string): boolean {
    const decoded = this.decodeJWT(jwt);
    if (!decoded) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return decoded.payload.exp <= now;
  }
}