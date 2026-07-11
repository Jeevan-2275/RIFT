import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Just import, wrap usage in try/catch fallback

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'y2k_cyber_secret_key_90210_passport';

// Middleware
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false })); // Allow scripts/styles
app.use(express.json());

// --- Operational State (In-Memory Database & Cache Fallbacks) ---
let users = [
  {
    id: "usr-01",
    name: "Nagesh Jagtap",
    email: "nagesh@rift.io",
    passwordHash: bcrypt.hashSync("password123", 10),
    role: "developer"
  }
];

let passports = [
  {
    id: "pass-01",
    ownerId: "usr-01",
    agentName: "FinanceBot-Alpha",
    agentType: "Financial Assistant",
    publicKey: "ecdsa-sha256-AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBN58...",
    qrCodeData: "AI-PASSPORT:FinanceBot-Alpha:pass-01",
    trustScore: 820,
    status: "active",
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "pass-02",
    ownerId: "usr-01",
    agentName: "ResearchScraper",
    agentType: "Web Scraper",
    publicKey: "ecdsa-sha256-AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBP92...",
    qrCodeData: "AI-PASSPORT:ResearchScraper:pass-02",
    trustScore: 950,
    status: "active",
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

let permissions = [
  {
    id: "perm-01",
    passportId: "pass-01",
    targetResource: "stripe.com",
    allowedActions: ["GET", "POST"],
    dailyLimitUSD: 100.00,
    spentTodayUSD: 18.50,
    status: "allowed"
  },
  {
    id: "perm-02",
    passportId: "pass-02",
    targetResource: "wikipedia.org",
    allowedActions: ["GET"],
    dailyLimitUSD: 0.00,
    spentTodayUSD: 0.00,
    status: "allowed"
  }
];

let activities = [
  {
    id: "act-01",
    passportId: "pass-01",
    actionRequested: "GET /v1/balance",
    actionDetail: "Fetch current wallet ledger balance.",
    requestPayload: "{}",
    riskLevel: "LOW",
    riskScore: 12,
    geminiReasoning: "Standard read operation for financial balances. Approved automatically.",
    decision: "approved",
    triggeredBy: "system",
    createdAt: new Date(Date.now() - 60000).toISOString()
  }
];

let pendingHoldTransaction = null; // Transaction held waiting for Socket approval

// Helper to push security logs into activity timeline
function recordActivity(passportId, actionRequested, actionDetail, payload, riskLevel, riskScore, reasoning, decision, triggeredBy) {
  const newAct = {
    id: `act-${Date.now()}`,
    passportId,
    actionRequested,
    actionDetail,
    requestPayload: JSON.stringify(payload),
    riskLevel,
    riskScore,
    geminiReasoning: reasoning,
    decision,
    triggeredBy,
    createdAt: new Date().toISOString()
  };
  activities.unshift(newAct);
  if (activities.length > 50) activities.pop();
  return newAct;
}

// --- JWT Auth Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access token missing." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token." });
    req.user = user;
    next();
  });
};

// --- WebSockets Real-Time Core ---
io.on('connection', (socket) => {
  console.log('Socket Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Socket Client disconnected:', socket.id);
  });
});

// --- REST API Routing ---

// Auth Register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Please enter all fields." });
  }

  const userExists = users.find(u => u.email === email);
  if (userExists) return res.status(400).json({ error: "User already registered." });

  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: "developer"
  };
  users.push(newUser);

  const token = jwt.sign({ id: newUser.id, name: newUser.name, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { name: newUser.name, email: newUser.email, role: newUser.role } });
});

// Auth Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: "Invalid credentials." });

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) return res.status(400).json({ error: "Invalid credentials." });

  const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// GET user passports
app.get('/api/passports', authenticateToken, (req, res) => {
  const userPassports = passports.filter(p => p.ownerId === req.user.id);
  res.json(userPassports);
});

// CREATE new passport
app.post('/api/passports', authenticateToken, (req, res) => {
  const { agentName, agentType } = req.body;
  if (!agentName || !agentType) return res.status(400).json({ error: "Invalid details." });

  const id = `pass-${Date.now()}`;
  const newPassport = {
    id,
    ownerId: req.user.id,
    agentName,
    agentType,
    publicKey: `ecdsa-sha256-MOCKKEY-${Math.random().toString(36).substring(7).toUpperCase()}`,
    qrCodeData: `AI-PASSPORT:${agentName}:${id}`,
    trustScore: 800,
    status: "active",
    createdAt: new Date().toISOString()
  };
  passports.push(newPassport);

  // Bind default permissions
  permissions.push({
    id: `perm-${Date.now()}`,
    passportId: id,
    targetResource: "api.github.com",
    allowedActions: ["GET"],
    dailyLimitUSD: 0,
    spentTodayUSD: 0,
    status: "allowed"
  });

  res.json(newPassport);
});

// DELETE/Revoke passport
app.delete('/api/passports/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const passIdx = passports.findIndex(p => p.id === id && p.ownerId === req.user.id);
  if (passIdx === -1) return res.status(404).json({ error: "Passport not found." });

  passports[passIdx].status = 'revoked';
  pushLog(`Passport for ${passports[passIdx].agentName} revoked.`, passports[passIdx].agentName, "blocked");
  res.json({ success: true, passport: passports[passIdx] });
});

// GET passport permissions
app.get('/api/permissions/:passportId', authenticateToken, (req, res) => {
  const passPerms = permissions.filter(p => p.passportId === req.params.passportId);
  res.json(passPerms);
});

// UPDATE/CREATE permission
app.post('/api/permissions', authenticateToken, (req, res) => {
  const { passportId, targetResource, allowedActions, dailyLimitUSD } = req.body;
  if (!passportId || !targetResource) return res.status(400).json({ error: "Invalid target resource." });

  // Update existing permission if matching targetResource
  const idx = permissions.findIndex(p => p.passportId === passportId && p.targetResource === targetResource);
  if (idx !== -1) {
    permissions[idx].allowedActions = allowedActions || permissions[idx].allowedActions;
    permissions[idx].dailyLimitUSD = dailyLimitUSD !== undefined ? parseFloat(dailyLimitUSD) : permissions[idx].dailyLimitUSD;
    return res.json(permissions[idx]);
  }

  // Create new rule
  const newPerm = {
    id: `perm-${Date.now()}`,
    passportId,
    targetResource,
    allowedActions: allowedActions || ["GET"],
    dailyLimitUSD: dailyLimitUSD !== undefined ? parseFloat(dailyLimitUSD) : 0,
    spentTodayUSD: 0,
    status: "allowed"
  };
  permissions.push(newPerm);
  res.json(newPerm);
});

// GET activity timeline logs
app.get('/api/activity/:passportId', authenticateToken, (req, res) => {
  const timeline = activities.filter(a => a.passportId === req.params.passportId);
  res.json(timeline);
});

// GET all activity logs (Dashboard logs view)
app.get('/api/activity', authenticateToken, (req, res) => {
  res.json(activities);
});

// CLEAR activity logs
app.post('/api/activity/clear', authenticateToken, (req, res) => {
  activities = [];
  res.json({ success: true, activities });
});

// GET system metrics analytics
app.get('/api/analytics/summary', authenticateToken, (req, res) => {
  const totalPassports = passports.length;
  const activeWarnings = activities.filter(a => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL').length;
  const avgTrust = Math.round(passports.reduce((sum, p) => sum + p.trustScore, 0) / (totalPassports || 1));
  res.json({
    totalPassports,
    activeWarnings,
    avgTrust,
    pendingTransaction: pendingHoldTransaction
  });
});

// --- Action Request API (The Gateway Interceptor) ---
app.post('/api/activity/request', async (req, res) => {
  const { passportId, resource, action, detail, amount } = req.body;
  if (!passportId || !resource || !action) {
    return res.status(400).json({ error: "Missing identity token properties." });
  }

  const passport = passports.find(p => p.id === passportId);
  if (!passport) return res.status(404).json({ error: "AI Passport invalid or revoked." });
  if (passport.status !== 'active') return res.status(403).json({ error: `Passport is currently ${passport.status}.` });

  // Evaluate Resource Permissions
  const perm = permissions.find(p => p.passportId === passportId && p.targetResource === resource);
  
  // Check action verb allowance
  if (perm && !perm.allowedActions.includes(action)) {
    recordActivity(passportId, `${action} ${resource}`, detail, req.body, "HIGH", 85, `Action ${action} is unauthorized for ${resource}.`, "rejected", "system");
    passport.trustScore = Math.max(0, passport.trustScore - 100); // Penalty
    return res.json({ decision: "blocked", reason: `Verb ${action} is blocked on domain ${resource} by ACL policies.` });
  }

  // Evaluate Risk via AI Guardian / Gemini SDK Fallbacks
  let riskScore = 15;
  let riskLevel = "LOW";
  let reasoning = "Standard query parameters match security baseline guidelines.";
  let decision = "approved";

  // Check for simple mock prompt injection heuristics
  const lowerDetail = (detail || "").toLowerCase();
  const isInjected = lowerDetail.includes("ignore") || lowerDetail.includes("verbatim") || lowerDetail.includes("system prompt") || lowerDetail.includes("override");
  
  if (isInjected) {
    riskScore = 90;
    riskLevel = "CRITICAL";
    reasoning = "Prompt Injection detected: instruction overrides or system prompt leakage attempts present in description.";
    decision = "rejected";
    passport.trustScore = Math.max(0, passport.trustScore - 150);
    
    const act = recordActivity(passportId, `${action} ${resource}`, detail, req.body, riskLevel, riskScore, reasoning, decision, "system");
    io.emit('activity_update', act);
    return res.json({ decision: "blocked", reason: reasoning });
  }

  // Evaluate financial limit thresholds
  const txAmount = amount ? parseFloat(amount) : 0;
  if (txAmount > 0 && perm) {
    // Spending limit reached
    if (perm.dailyLimitUSD > 0 && (perm.spentTodayUSD + txAmount > perm.dailyLimitUSD)) {
      riskScore = 75;
      riskLevel = "HIGH";
      reasoning = `Daily transaction limit exceeded ($${txAmount} + $${perm.spentTodayUSD} spent > limit $${perm.dailyLimitUSD}).`;
      decision = "pending";
    }
  }

  if (decision === "pending") {
    // Trigger hold state
    pendingHoldTransaction = {
      id: `hitl-${Date.now()}`,
      passportId,
      agentName: passport.agentName,
      vendor: resource,
      amount: txAmount,
      risk: `${riskLevel} Risk (${riskScore}/100)`,
      detail
    };

    const act = recordActivity(passportId, `${action} ${resource}`, detail, req.body, riskLevel, riskScore, reasoning, "pending", "system");
    
    // Broadcast sockets hold update immediately
    io.emit('hold_trigger', pendingHoldTransaction);
    io.emit('activity_update', act);

    return res.json({ decision: "hold", message: "Action hold. Manual release signature required." });
  }

  // Automatically approve standard clean requests
  if (perm && txAmount > 0) {
    perm.spentTodayUSD = parseFloat((perm.spentTodayUSD + txAmount).toFixed(2));
  }

  const act = recordActivity(passportId, `${action} ${resource}`, detail, req.body, riskLevel, riskScore, reasoning, "approved", "system");
  io.emit('activity_update', act);
  res.json({ decision: "approved", reasoning });
});

// Approve HITL request from Dashboard Sockets
app.post('/api/transactions/approve', authenticateToken, (req, res) => {
  if (!pendingHoldTransaction) return res.status(400).json({ error: "No transaction hold active." });

  const tx = pendingHoldTransaction;
  const perm = permissions.find(p => p.passportId === tx.passportId && p.targetResource === tx.vendor);
  if (perm && tx.amount > 0) {
    perm.spentTodayUSD = parseFloat((perm.spentTodayUSD + tx.amount).toFixed(2));
  }

  // Update decision of the pending log in activities list
  const logIdx = activities.findIndex(a => a.passportId === tx.passportId && a.decision === 'pending');
  if (logIdx !== -1) {
    activities[logIdx].decision = 'approved';
    activities[logIdx].geminiReasoning = `Approved by human administrator signature.`;
  }

  pendingHoldTransaction = null;
  io.emit('hold_resolved', { approved: true });
  res.json({ success: true });
});

// Deny HITL request
app.post('/api/transactions/deny', authenticateToken, (req, res) => {
  if (!pendingHoldTransaction) return res.status(400).json({ error: "No transaction hold active." });

  const tx = pendingHoldTransaction;
  const passport = passports.find(p => p.id === tx.passportId);
  if (passport) {
    passport.trustScore = Math.max(0, passport.trustScore - 80);
  }

  // Update activity status
  const logIdx = activities.findIndex(a => a.passportId === tx.passportId && a.decision === 'pending');
  if (logIdx !== -1) {
    activities[logIdx].decision = 'rejected';
    activities[logIdx].geminiReasoning = `Blocked by human administrator decision. Security score penalized.`;
  }

  pendingHoldTransaction = null;
  threatsCount = (threatsCount || 0) + 1; // Increment threats counters
  io.emit('hold_resolved', { approved: false });
  res.json({ success: true });
});

// Toggle policies configuration
app.post('/api/policies/toggle', authenticateToken, (req, res) => {
  const { policyName } = req.body;
  if (policyName in policies) {
    policies[policyName] = !policies[policyName];
  }
  res.json({ success: true, policies });
});

app.get('/api/policies', authenticateToken, (req, res) => {
  res.json(policies);
});

// --- Dynamic AI Agent Background Simulation Client (Sockets simulation) ---
// Generates traffic dynamically to simulate multiple agents interacting on the web
setInterval(() => {
  if (pendingHoldTransaction) return; // Wait if there's a hold

  const randPass = passports[Math.floor(Math.random() * passports.length)];
  if (randPass.status !== 'active') return;

  const logsSafe = [
    { res: "wikipedia.org", act: "GET", detail: "Read introduction paragraph for topic 'Y2K bug'." },
    { res: "api.github.com", act: "GET", detail: "Read pull request issues timeline." },
    { res: "stripe.com", act: "GET", detail: "Lookup current subscription parameters." }
  ];

  const choice = Math.random();
  if (choice > 0.85) {
    // Generate transaction request
    const amount = parseFloat((Math.random() * 150 + 10).toFixed(2));
    
    // Call the actual request endpoint code to process correctly
    const mockReq = {
      passportId: randPass.id,
      resource: "stripe.com",
      action: "POST",
      detail: `Transfer payout sum $${amount.toFixed(2)} to merchant renewal API.`,
      amount
    };

    fetch(`http://localhost:${PORT}/api/activity/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockReq)
    }).catch(err => {
      // Direct execute in-memory if server starts up concurrently
      const perm = permissions.find(p => p.passportId === randPass.id && p.targetResource === "stripe.com");
      if (amount > (perm?.dailyLimitUSD || 50.00)) {
        pendingHoldTransaction = {
          id: `hitl-${Date.now()}`,
          passportId: randPass.id,
          agentName: randPass.agentName,
          vendor: "stripe.com",
          amount,
          risk: "HIGH Risk (75/100)",
          detail: mockReq.detail
        };
        const act = recordActivity(randPass.id, "POST stripe.com", mockReq.detail, mockReq, "HIGH", 75, "Daily transaction limit exceeded.", "pending", "system");
        io.emit('hold_trigger', pendingHoldTransaction);
        io.emit('activity_update', act);
      }
    });

  } else {
    // Generate safe log
    const template = logsSafe[Math.floor(Math.random() * logsSafe.length)];
    recordActivity(randPass.id, `${template.act} ${template.res}`, template.detail, {}, "LOW", 10, "Safe standard interaction validated.", "approved", "system");
    io.emit('activity_update', activities[0]);
  }
}, 6000);

server.listen(PORT, () => {
  console.log(`Express AI Passport server running on http://localhost:${PORT}`);
});
