// mock-server.js
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Mock SESSION_KEY global para el evento
const SESSION_KEY = "demo_session_key_supersecret_2025";

// Mock staff database
const mockStaff = {
  "carlos": {
    staffId: "carlos",
    displayName: "Carlos Rodríguez",
    role: "GATE",
    pin: "1234",
    gateId: "gate_1"
  },
  "maya": {
    staffId: "maya", 
    displayName: "Maya López",
    role: "ZONE",
    pin: "4321",
    zoneCheckpointId: "zc_10"
  },
  "admin": {
    staffId: "admin",
    displayName: "Admin User",
    role: "GATE", 
    pin: "0000",
    gateId: "gate_1"
  }
};

// Simulación de base de datos de tickets
const mockTickets = {
  "TK-001": {
    ticketId: "TK-001",
    eventId: "evt_1",
    status: "ACTIVE",
    holderName: "Ana María Gómez",
    entitlements: ["Z-VIP", "Z-BSTG", "Z-PRESS"],
    gateAllowlist: ["G-SUR", "G-NORTE"]
  }
};

// Endpoint para login de staff
app.post('/api/staff/login', (req, res) => {
  const { staffId, pin } = req.body;
  
  console.log(`🔐 Staff login attempt: ${staffId}`);
  
  if (!staffId || !pin) {
    return res.status(400).json({
      error: "staffId and pin are required"
    });
  }

  const staff = mockStaff[staffId];
  
  if (!staff) {
    console.log(`❌ Staff not found: ${staffId}`);
    return res.status(404).json({
      error: "Staff not found"
    });
  }

  if (staff.pin !== pin) {
    console.log(`❌ Invalid PIN for staff: ${staffId}`);
    return res.status(401).json({
      error: "Invalid PIN"
    });
  }

  const response = {
    staffId: staff.staffId,
    displayName: staff.displayName,
    role: staff.role,
    ...(staff.gateId && { gateId: staff.gateId }),
    ...(staff.zoneCheckpointId && { zoneCheckpointId: staff.zoneCheckpointId })
  };

  console.log(`✅ Staff authenticated: ${staff.displayName} (${staff.role})`);
  res.json(response);
});

// Endpoint principal: obtener sesión de ticket
app.get('/api/tickets/:id/session', (req, res) => {
  const ticketId = req.params.id;
  
  console.log(`📱 Client App solicitando sesión para ticket: ${ticketId}`);
  
  // Verificar si el ticket existe
  if (!mockTickets[ticketId]) {
    return res.status(404).json({
      error: "Ticket not found"
    });
  }

  const ticket = mockTickets[ticketId];
  
  // Verificar estado del ticket
  if (ticket.status !== 'ACTIVE') {
    return res.status(400).json({
      error: "Ticket not active"
    });
  }

  // Calcular expiración de sesión (24 horas desde ahora)
  const now = Math.floor(Date.now() / 1000);
  const sessionExp = now + (24 * 60 * 60); // 24 horas

  const response = {
    ticketId: ticket.ticketId,
    session_key: SESSION_KEY,
    exp: sessionExp
  };

  console.log(`✅ Entregando SESSION_KEY para ${ticketId}`);
  res.json(response);
});

// Endpoint para validación de QR en puertas (Gate)
app.post('/validate/scan', (req, res) => {
  const { qr, gateId } = req.body;
  
  console.log(`🚪 Gate validation: ${gateId} scanning QR`);
  
  if (!qr || !gateId) {
    return res.json({
      decision: "DENY",
      reason: "INVALID"
    });
  }

  // Simular validación de JWT
  try {
    // Decodificar JWT básico (sin verificación de firma para demo)
    const parts = qr.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const now = Math.floor(Date.now() / 1000);
    
    // Verificar expiración
    if (payload.exp < now) {
      return res.json({
        decision: "DENY",
        reason: "EXPIRED"
      });
    }

    // Verificar ticket existe
    const ticketId = payload.sub || payload.tid;
    const ticket = mockTickets[ticketId];
    
    if (!ticket) {
      return res.json({
        decision: "DENY", 
        reason: "NOT_FOUND"
      });
    }

    if (ticket.status !== 'ACTIVE') {
      return res.json({
        decision: "DENY",
        reason: "USED"
      });
    }

    // Simular consumo de ticket
    ticket.status = 'USED';
    ticket.usedAt = new Date().toISOString();

    console.log(`✅ Gate access granted for ticket: ${ticketId}`);
    
    res.json({
      decision: "ALLOW",
      ticketId: ticketId,
      entitlements: ticket.entitlements || []
    });

  } catch (error) {
    console.error('JWT validation error:', error);
    res.json({
      decision: "DENY",
      reason: "INVALID"
    });
  }
});

// Endpoint para validación de QR en zonas
app.post('/zones/checkpoint/scan', (req, res) => {
  const { qr, zoneCheckpointId } = req.body;
  
  console.log(`🏢 Zone validation: ${zoneCheckpointId} scanning QR`);
  
  if (!qr || !zoneCheckpointId) {
    return res.json({
      decision: "DENY",
      reason: "INVALID"
    });
  }

  // Simular validación similar a gate
  try {
    const parts = qr.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp < now) {
      return res.json({
        decision: "DENY",
        reason: "EXPIRED"
      });
    }

    const ticketId = payload.sub || payload.tid;
    const ticket = mockTickets[ticketId];
    
    if (!ticket) {
      return res.json({
        decision: "DENY",
        reason: "NOT_FOUND"
      });
    }

    // Para demo, permitir acceso a zonas VIP
    if (ticketId === 'TK-001') {
      console.log(`✅ Zone access granted for ticket: ${ticketId}`);
      
      res.json({
        decision: "ALLOW"
      });
    } else {
      res.json({
        decision: "DENY",
        reason: "NO_ENTITLEMENT"
      });
    }

  } catch (error) {
    console.error('Zone JWT validation error:', error);
    res.json({
      decision: "DENY", 
      reason: "INVALID"
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Endpoint adicional para debugging
app.get('/api/debug/ticket/:id', (req, res) => {
  const ticketId = req.params.id;
  const ticket = mockTickets[ticketId];
  
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  res.json({
    ticket,
    session_key: SESSION_KEY,
    current_time: Math.floor(Date.now() / 1000)
  });
});

// Endpoint para listar staff disponibles (debug)
app.get('/api/debug/staff', (req, res) => {
  const staffList = Object.values(mockStaff).map(staff => ({
    staffId: staff.staffId,
    displayName: staff.displayName,
    role: staff.role,
    pin: '****' // No mostrar PINs reales
  }));
  
  res.json(staffList);
});

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 Mock Backoffice Server iniciado');
  console.log(`📡 Escuchando en http://localhost:${PORT}`);
  console.log('\n📋 Endpoints disponibles:');
  console.log(`   POST /api/staff/login          - Login de staff`);
  console.log(`   GET  /api/tickets/:id/session  - Obtener sesión de ticket`);
  console.log(`   POST /validate/scan            - Validar QR en puerta`);
  console.log(`   POST /zones/checkpoint/scan    - Validar QR en zona`);
  console.log(`   GET  /health                   - Health check`);
  console.log(`   GET  /api/debug/staff          - Listar staff disponible`);
  console.log('\n🎫 Tickets de prueba:');
  console.log(`   TK-001 (Ana María Gómez) - ACTIVE`);
  console.log('\n👥 Staff de prueba:');
  console.log(`   carlos/1234 (Gate Staff)`);
  console.log(`   maya/4321   (Zone Staff)`);
  console.log(`   admin/0000  (Admin)`);
  console.log(`\n🔑 SESSION_KEY: ${SESSION_KEY}`);
});

