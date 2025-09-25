// src/config/appConfig.ts

export interface AppConfig {
  // Backoffice Configuration
  backoffice: {
    baseUrl: string;
    timeout: number;
    healthCheckInterval: number;
  };
  
  // QR Configuration
  qr: {
    ttlSeconds: number;
    syncIntervalMs: number;
    clockSkewSeconds: number;
    refreshThreshold: number; // Segundos antes de expiración para mostrar warning
  };
  
  // Event Configuration
  event: {
    id: string;
    name: string;
    venue: string;
    date: string;
  };
  
  // UI Configuration
  ui: {
    brightnessDuration: number; // ms
    brightnessLevel: number; // %
    autoRetryInterval: number; // ms
    maxRetries: number;
  };
}

// Configuración por defecto
const defaultConfig: AppConfig = {
  backoffice: {
    baseUrl: 'http://localhost:8080', // El mock server está en 8080
    timeout: 5000,
    healthCheckInterval: 30000
  },
  
  qr: {
    ttlSeconds: 20,
    syncIntervalMs: 60000,
    clockSkewSeconds: 0,
    refreshThreshold: 5
  },
  
  event: {
    id: 'evt_1',
    name: 'SuperFest 2025',
    venue: 'Estadio Nacional',
    date: '25 Sept 2025'
  },
  
  ui: {
    brightnessDuration: 5000,
    brightnessLevel: 150,
    autoRetryInterval: 10000,
    maxRetries: 3
  }
};

// Función para obtener configuración desde variables de entorno
const getEnvConfig = (): Partial<AppConfig> => {
  const envConfig: Partial<AppConfig> = {};

  // Backoffice URL desde variable de entorno
  if (process.env.REACT_APP_BACKOFFICE_URL) {
    envConfig.backoffice = {
      ...defaultConfig.backoffice,
      baseUrl: process.env.REACT_APP_BACKOFFICE_URL
    };
  }

  // Event ID desde variable de entorno
  if (process.env.REACT_APP_EVENT_ID) {
    envConfig.event = {
      ...defaultConfig.event,
      id: process.env.REACT_APP_EVENT_ID
    };
  }

  // QR TTL desde variable de entorno
  if (process.env.REACT_APP_QR_TTL_SECONDS) {
    const ttl = parseInt(process.env.REACT_APP_QR_TTL_SECONDS, 10);
    if (!isNaN(ttl) && ttl > 0) {
      envConfig.qr = {
        ...defaultConfig.qr,
        ttlSeconds: ttl
      };
    }
  }

  return envConfig;
};

// Función para merger configuraciones
const mergeConfig = (base: AppConfig, override: Partial<AppConfig>): AppConfig => {
  return {
    backoffice: { ...base.backoffice, ...override.backoffice },
    qr: { ...base.qr, ...override.qr },
    event: { ...base.event, ...override.event },
    ui: { ...base.ui, ...override.ui }
  };
};

// Configuración final
export const appConfig: AppConfig = mergeConfig(defaultConfig, getEnvConfig());

// Función para validar configuración
export const validateConfig = (config: AppConfig): string[] => {
  const errors: string[] = [];

  if (!config.backoffice.baseUrl) {
    errors.push('URL del Backoffice es requerida');
  }

  if (config.qr.ttlSeconds <= 0) {
    errors.push('TTL del QR debe ser mayor a 0');
  }

  if (config.qr.ttlSeconds > 300) {
    errors.push('TTL del QR no debe ser mayor a 5 minutos por seguridad');
  }

  if (!config.event.id) {
    errors.push('ID del evento es requerido');
  }

  if (config.ui.maxRetries <= 0) {
    errors.push('Número máximo de reintentos debe ser mayor a 0');
  }

  return errors;
};

// Hook para usar la configuración
export const useAppConfig = () => {
  return appConfig;
};

// Función para debug de configuración (solo en desarrollo)
export const debugConfig = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔧 App Configuration');
    console.log('Backoffice URL:', appConfig.backoffice.baseUrl);
    console.log('Event ID:', appConfig.event.id);
    console.log('QR TTL:', appConfig.qr.ttlSeconds + 's');
    console.log('Sync Interval:', appConfig.qr.syncIntervalMs + 'ms');
    
    const validationErrors = validateConfig(appConfig);
    if (validationErrors.length > 0) {
      console.warn('⚠️ Configuration Issues:', validationErrors);
    } else {
      console.log('✅ Configuration is valid');
    }
    console.groupEnd();
  }
};