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
  console.log(`   GET /api/tickets/:id/session  - Obtener sesión de ticket`);
  console.log(`   GET /health                   - Health check`);
  console.log(`   GET /api/debug/ticket/:id     - Debug info`);
  console.log('\n🎫 Tickets de prueba:');
  console.log(`   TK-001 (Ana María Gómez) - ACTIVE`);
  console.log(`\n🔑 SESSION_KEY: ${SESSION_KEY}`);
  console.log('\n💡 Para probar:');
  console.log(`   curl http://localhost:${PORT}/api/tickets/TK-001/session`);
});

