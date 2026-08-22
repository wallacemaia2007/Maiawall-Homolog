require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { z } = require("zod");
const databaseService = require("./src/services/databaseService");
const { assertSafeDatabaseConfig, getRuntimeInfo } = require("./src/config/environmentGuard");
const { validateBody } = require("./middlewares/validateBody");

function assertRequiredEnv(names) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error("Variaveis de ambiente obrigatorias nao definidas:");
    missing.forEach((name) => console.error(`   - ${name}`));
    process.exit(1);
  }
}

if (!process.env.MONGODB_URI && process.env.MONGO_URI) {
  process.env.MONGODB_URI = process.env.MONGO_URI;
}

assertRequiredEnv(["JWT_SECRET", "MONGODB_URI"]);
assertSafeDatabaseConfig();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_COOKIE_NAME = "mw_session";
const CSRF_COOKIE_NAME = "mw_csrf";
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

const PROJECT_STATUSES = [
  "DEVELOPMENT",
  "HOMOLOGATION",
  "CHANGES_REQUESTED",
  "APPROVED",
  "PRODUCTION",
  "COMPLETED",
];

const ACTIVITY_TYPES = [
  "PROJECT_CREATED",
  "PROJECT_UPDATED",
  "VERSION_RELEASED",
  "STATUS_CHANGED",
  "APPROVAL_REQUESTED",
  "PROJECT_APPROVED",
  "CHANGES_REQUESTED",
];

const INVESTMENT_STATUSES = ["ACTIVE", "PAID", "PARTIALLY_PAID", "PENDING", "OVERDUE", "CANCELLED"];
const INSTALLMENT_STATUSES = ["PAID", "PENDING", "OVERDUE"];
const PLAN_STATUSES = ["ACTIVE", "PAUSED", "CANCELLED", "EXPIRED"];
const PLAN_BILLING_CYCLES = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"];
const PLAN_PAYMENT_STATUSES = ["PAID", "PENDING", "OVERDUE"];
const PENDING_STATUSES = ["PENDING", "RESPONDED", "COMPLETED", "CANCELLED"];
const loginSchema = z.object({
  email: z.string().email("E-mail invalido"),
  password: z.string().min(1, "Senha obrigatoria"),
});

const userProfilePatchSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio").optional(),
  email: z.string().email("E-mail invalido").optional(),
  cpf: z.string().optional(),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  profession: z.string().optional(),
  company: z.string().optional(),
  address: z.object({
    cep: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
});

const clientSettingsPatchSchema = z.object({
  companyProfile: z.object({
    displayName: z.string().optional(),
    cnpj: z.string().optional(),
    phone: z.string().optional(),
    commercialEmail: z.string().email("E-mail comercial invalido").optional().or(z.literal("")),
    address: z.string().optional(),
    logoUrl: z.string().url("URL da logo invalida").optional().or(z.literal("")),
    brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor principal invalida").optional(),
  }).partial().optional(),
  notifications: z.object({
    newProjects: z.boolean().optional(),
    releases: z.boolean().optional(),
    pendingItems: z.boolean().optional(),
    installments: z.boolean().optional(),
    passwordRecovery: z.boolean().optional(),
    meetings: z.boolean().optional(),
  }).partial().optional(),
  meetingPreferences: z.object({
    availableStartTime: z.string().regex(/^\d{2}:\d{2}$/, "Horario inicial invalido").optional(),
    availableEndTime: z.string().regex(/^\d{2}:\d{2}$/, "Horario final invalido").optional(),
    reminderMinutes: z.number().int().min(0).optional(),
  }).partial().optional(),
});

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().default(""),
  imageUrl: z.string().url().optional().or(z.literal("")).default(""),
  clientId: z.string().optional(),
  isPrimary: z.boolean().optional().default(false),
  status: z.enum(PROJECT_STATUSES).optional().default("DEVELOPMENT"),
  progress: z.number().min(0).max(100).optional().default(0),
  version: z.string().optional().default("v0.1.0"),
  productionUrl: z.string().url().optional().or(z.literal("")).default(""),
  homologationUrl: z.string().url().optional().or(z.literal("")).default(""),
  repositoryUrl: z.string().url().optional().or(z.literal("")).default(""),
});

const projectPatchSchema = projectSchema.partial().extend({
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
});

const requestChangesSchema = z.object({
  message: z.string().min(3, "Mensagem obrigatoria"),
});

const investmentSchema = z.object({
  projectId: z.string(),
  clientId: z.string().optional(),
  name: z.string().min(2),
  totalAmount: z.number().min(0),
  installments: z.number().int().min(1),
  installmentAmount: z.number().min(0).optional(),
  status: z.enum(INVESTMENT_STATUSES).optional().default("ACTIVE"),
});

const installmentSchema = z.object({
  number: z.number().int().min(1),
  amount: z.number().min(0),
  dueDate: z.string().min(1),
  paidAt: z.string().nullable().optional().default(null),
  status: z.enum(INSTALLMENT_STATUSES).optional().default("PENDING"),
});

const installmentPatchSchema = installmentSchema.partial();

const planSchema = z.object({
  projectId: z.string(),
  clientId: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional().default(""),
  amount: z.number().min(0),
  billingCycle: z.enum(PLAN_BILLING_CYCLES).optional().default("MONTHLY"),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable().default(null),
  status: z.enum(PLAN_STATUSES).optional().default("ACTIVE"),
  includedItems: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().optional(),
    limit: z.string().optional(),
    status: z.string().optional(),
  })).optional().default([]),
  extraCosts: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    description: z.string().optional(),
    amount: z.number().min(0),
    periodicity: z.enum([...PLAN_BILLING_CYCLES, "ONE_TIME"]).optional().default("MONTHLY"),
    nextDueDate: z.string().optional().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE", "PAUSED"]).optional().default("ACTIVE"),
  })).optional().default([]),
});

const planPaymentSchema = z.object({
  number: z.number().int().min(1),
  amount: z.number().min(0),
  dueDate: z.string().min(1),
  paidAt: z.string().nullable().optional().default(null),
  status: z.enum(PLAN_PAYMENT_STATUSES).optional().default("PENDING"),
});

const planPaymentPatchSchema = planPaymentSchema.partial();

const notificationReadSchema = z.object({
  read: z.boolean().optional().default(true),
});

const pendingReadSchema = z.object({
  read: z.boolean().optional().default(true),
});

const pendingResponseSchema = z.object({
  responses: z.array(z.object({
    fieldId: z.string().min(1),
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional().nullable(),
  })).optional().default([]),
});

const allowedCorsOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  "http://localhost:4200",
  "http://127.0.0.1:4200",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
].filter(Boolean);

app.use((req, res, next) => {
  cors({
    origin(origin, callback) {
      if (!origin || allowedCorsOrigins.includes(origin) || isSameOrigin(req, origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origem nao permitida pelo CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "ngrok-skip-browser-warning"],
  })(req, res, next);
});

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use((req, _res, next) => {
  req.cookies = parseCookies(req.headers.cookie);
  next();
});

app.use(async (_req, res, next) => {
  try {
    await databaseService.ensureLoaded();
    next();
  } catch (error) {
    console.error("Erro ao carregar dados do MongoDB:", error);
    res.status(503).json(errorResponse("Banco de dados temporariamente indisponivel"));
  }
});

app.get("/api/health/storage", (_req, res) => {
  const db = databaseService.getState();
  const runtime = getRuntimeInfo();

  if (!runtime.isLocal) {
    return res.json(successResponse({
      status: "ok",
      storage: "mongodb",
      environment: runtime.environment,
    }));
  }

  res.json(successResponse({
    status: "ok",
    storage: "mongodb",
    runtime,
    counts: {
      users: db.users.length,
      projects: db.projects.length,
      investmentPlans: db.investmentPlans.length,
      installments: db.installments.length,
      notifications: db.notifications.length,
      pending: db.pending.length,
    },
  }));
});

app.post("/api/auth/login", loginLimiter, validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const db = databaseService.getState();
  const user = db.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());

  if (!user || user.active === false) {
    return res.status(401).json(errorResponse("Credenciais invalidas"));
  }

  const isValid = await bcrypt.compare(password, user.passwordHash || "");
  if (!isValid) {
    return res.status(401).json(errorResponse("Credenciais invalidas"));
  }

  const csrfToken = crypto.randomBytes(32).toString("hex");
  const token = signToken(user, csrfToken);
  setAuthCookies(res, token, csrfToken);

  const payload = {
    accessToken: token,
    csrfToken,
    user: publicUser(user),
  };

  res.json(successResponse(payload));
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const payload = { user: publicUser(req.user) };
  res.json(successResponse(payload));
});

app.post("/api/auth/logout", (_req, res) => {
  clearAuthCookies(res);
  res.status(204).send();
});

app.post("/api/auth/forgot-password", validateBody(z.object({ email: z.string().email() })), async (req, res) => {
  const db = databaseService.getState();
  const user = db.users.find((item) => item.email?.toLowerCase() === req.body.email.toLowerCase());

  if (user && user.active !== false) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const recoveryToken = {
      id: databaseService.createObjectId(),
      userId: user.id,
      email: req.body.email.toLowerCase(),
      tokenHash,
      usedAt: null,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    db.passwordRecoveryTokens.push(recoveryToken);
    await databaseService.insertDocument("passwordRecoveryTokens", recoveryToken);

    if (isLocalRuntime()) {
      return res.status(202).json(successResponse({ accepted: true, resetToken: rawToken, expiresAt }));
    }
  }

  res.status(202).json(successResponse({ accepted: true }));
});

app.get("/api/users/me", requireAuth, (req, res) => {
  res.json(successResponse(publicUser(req.user)));
});

app.patch("/api/users/me", requireAuth, validateBody(userProfilePatchSchema), async (req, res) => {
  const db = databaseService.getState();
  const user = db.users.find((item) => item.id === req.user.id);

  if (!user) {
    return res.status(404).json(errorResponse("Usuario nao encontrado"));
  }

  if (req.body.email) {
    const normalizedEmail = req.body.email.trim().toLowerCase();
    const emailInUse = db.users.some(
      (item) => item.id !== user.id && item.email?.toLowerCase() === normalizedEmail,
    );

    if (emailInUse) {
      return res.status(409).json(errorResponse("Este e-mail ja esta em uso"));
    }

    user.email = normalizedEmail;
  }

  const editableFields = ["name", "cpf", "phone", "birthDate", "gender", "profession", "company"];

  editableFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      user[field] = typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
    }
  });

  if (req.body.address) {
    user.address = Object.fromEntries(
      Object.entries(req.body.address).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]),
    );
  }

  user.updatedAt = new Date().toISOString();

  await databaseService.replaceDocument("users", user);
  res.json(successResponse(publicUser(user)));
});

app.get("/api/users", requireAuth, requireRole("ADMIN"), (_req, res) => {
  const users = databaseService.getState().users.map(publicUser);
  res.json(successResponse(users));
});

app.get("/api/client-settings/me", requireAuth, (req, res) => {
  res.json(successResponse(getClientSettingsForUser(req.user)));
});

app.patch("/api/client-settings/me", requireAuth, validateBody(clientSettingsPatchSchema), async (req, res) => {
  const settings = await upsertClientSettings(req.user, req.body);
  res.json(successResponse(settings));
});

app.get("/api/client-settings/:clientId", requireAuth, requireRole("ADMIN"), (req, res) => {
  const client = findClientUser(req.params.clientId);
  if (!client) {
    return res.status(404).json(errorResponse("Cliente nao encontrado"));
  }

  res.json(successResponse(getClientSettingsForUser(client)));
});

app.patch("/api/client-settings/:clientId", requireAuth, requireRole("ADMIN"), validateBody(clientSettingsPatchSchema), async (req, res) => {
  const client = findClientUser(req.params.clientId);
  if (!client) {
    return res.status(404).json(errorResponse("Cliente nao encontrado"));
  }

  const settings = await upsertClientSettings(client, req.body);
  res.json(successResponse(settings));
});

app.get("/api/projects", requireAuth, (req, res) => {
  const projects = getVisibleProjects(req.user).sort(sortNewest);
  res.json(successResponse(projects));
});

app.get("/api/projects/:id", requireAuth, (req, res) => {
  const project = findProjectForUser(req.params.id, req.user);
  if (!project) return res.status(404).json(errorResponse("Projeto nao encontrado"));
  res.json(successResponse(project));
});

app.post("/api/projects", requireAuth, requireRole("ADMIN"), validateBody(projectSchema), async (req, res) => {
  const now = new Date().toISOString();
  const clientId = req.body.clientId || req.user.id;
  const project = {
    id: databaseService.createObjectId(),
    ...req.body,
    clientId,
    createdAt: now,
    updatedAt: now,
  };

  const db = databaseService.getState();
  const changedPrimaryProjects = project.isPrimary ? clearPrimaryProjects(db, project.clientId) : [];
  db.projects.push(project);
  addActivity(db, project.id, "PROJECT_CREATED", "Projeto criado", `Projeto ${project.name} cadastrado.`);
  await databaseService.replaceDocuments("projects", changedPrimaryProjects);
  await databaseService.insertDocument("projects", project);
  await databaseService.insertDocument("projectActivities", db.projectActivities.at(-1));
  res.status(201).json(successResponse(project));
});

app.put("/api/projects/:id", requireAuth, requireRole("ADMIN"), validateBody(projectSchema), updateProject);
app.patch("/api/projects/:id", requireAuth, requireRole("ADMIN"), validateBody(projectPatchSchema), updateProject);

app.delete("/api/projects/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const db = databaseService.getState();
  const index = db.projects.findIndex((project) => project.id === req.params.id);
  if (index < 0) return res.status(404).json(errorResponse("Projeto nao encontrado"));

  db.projects.splice(index, 1);
  db.projectActivities = db.projectActivities.filter((item) => item.projectId !== req.params.id);
  db.projectReleases = db.projectReleases.filter((item) => item.projectId !== req.params.id);
  db.projectCommits = db.projectCommits.filter((item) => item.projectId !== req.params.id);
  await databaseService.deleteDocument("projects", req.params.id);
  await databaseService.deleteDocumentsByField("projectActivities", "projectId", req.params.id);
  await databaseService.deleteDocumentsByField("projectReleases", "projectId", req.params.id);
  await databaseService.deleteDocumentsByField("projectCommits", "projectId", req.params.id);
  res.status(204).send();
});

app.get("/api/projects/:id/activities", requireAuth, (req, res) => {
  const project = findProjectForUser(req.params.id, req.user);
  if (!project) return res.status(404).json(errorResponse("Projeto nao encontrado"));
  const items = databaseService.getState().projectActivities
    .filter((item) => item.projectId === project.id)
    .sort(sortNewest);
  res.json(successResponse(items));
});

app.get("/api/projects/:id/releases", requireAuth, (req, res) => {
  const project = findProjectForUser(req.params.id, req.user);
  if (!project) return res.status(404).json(errorResponse("Projeto nao encontrado"));
  const items = databaseService.getState().projectReleases
    .filter((item) => item.projectId === project.id)
    .sort(sortReleasedNewest);
  res.json(successResponse(items));
});

app.get("/api/projects/:id/commits", requireAuth, (req, res) => {
  const project = findProjectForUser(req.params.id, req.user);
  if (!project) return res.status(404).json(errorResponse("Projeto nao encontrado"));
  const items = databaseService.getState().projectCommits
    .filter((item) => item.projectId === project.id)
    .sort(sortNewest);
  res.json(successResponse(items));
});

app.get("/api/projects/:id/investments", requireAuth, (req, res) => {
  const project = findProjectForUser(req.params.id, req.user);
  if (!project) return res.status(404).json(errorResponse("Projeto nao encontrado"));
  const plans = getVisibleInvestmentPlans(req.user).filter((plan) => plan.projectId === project.id);
  res.json(successResponse(plans.map(withInvestmentCalculations)));
});

app.post("/api/projects/:id/approve", requireAuth, async (req, res) => {
  const db = databaseService.getState();
  const project = findProjectForUser(req.params.id, req.user);
  if (!project) return res.status(404).json(errorResponse("Projeto nao encontrado"));
  if (!["HOMOLOGATION", "CHANGES_REQUESTED"].includes(project.status)) {
    return res.status(409).json(errorResponse("Projeto nao esta em estado compativel para aprovacao"));
  }

  project.status = "APPROVED";
  project.progress = 100;
  project.updatedAt = new Date().toISOString();
  addActivity(db, project.id, "PROJECT_APPROVED", "Projeto aprovado", "Cliente aprovou o projeto.");
  await databaseService.replaceDocument("projects", project);
  await databaseService.insertDocument("projectActivities", db.projectActivities.at(-1));
  res.json(successResponse(project));
});

app.post("/api/projects/:id/request-changes", requireAuth, validateBody(requestChangesSchema), async (req, res) => {
  const db = databaseService.getState();
  const project = findProjectForUser(req.params.id, req.user);
  if (!project) return res.status(404).json(errorResponse("Projeto nao encontrado"));
  if (!["HOMOLOGATION", "APPROVED"].includes(project.status)) {
    return res.status(409).json(errorResponse("Projeto nao aceita solicitacao de alteracoes neste status"));
  }

  project.status = "CHANGES_REQUESTED";
  project.updatedAt = new Date().toISOString();
  addActivity(db, project.id, "CHANGES_REQUESTED", "Alteracoes solicitadas", req.body.message);
  await databaseService.replaceDocument("projects", project);
  await databaseService.insertDocument("projectActivities", db.projectActivities.at(-1));
  res.status(201).json(successResponse({ projectId: project.id, message: req.body.message }));
});

app.get("/api/investments", requireAuth, (req, res) => {
  res.json(successResponse(getVisibleInvestmentPlans(req.user).map(withInvestmentCalculations)));
});

app.get("/api/investments/:id", requireAuth, (req, res) => {
  const plan = getVisibleInvestmentPlans(req.user).find((item) => item.id === req.params.id);
  if (!plan) return res.status(404).json(errorResponse("Plano financeiro nao encontrado"));
  res.json(successResponse(withInvestmentCalculations(plan)));
});

app.post("/api/investments", requireAuth, requireRole("ADMIN"), validateBody(investmentSchema), async (req, res) => {
  const db = databaseService.getState();
  const project = db.projects.find((item) => item.id === req.body.projectId);
  if (!project) return res.status(404).json(errorResponse("Projeto nao encontrado"));
  if (req.body.clientId && req.body.clientId !== project.clientId) {
    return res.status(400).json(errorResponse("Cliente do plano deve ser o mesmo cliente do projeto"));
  }

  const now = new Date().toISOString();
  const plan = {
    id: databaseService.createObjectId(),
    projectId: project.id,
    clientId: req.body.clientId || project.clientId,
    name: req.body.name,
    totalAmount: req.body.totalAmount,
    installments: req.body.installments,
    installmentAmount: req.body.installmentAmount || roundCurrency(req.body.totalAmount / req.body.installments),
    status: req.body.status,
    createdAt: now,
    updatedAt: now,
  };

  db.investmentPlans.push(plan);
  await databaseService.insertDocument("investmentPlans", plan);
  res.status(201).json(successResponse(withInvestmentCalculations(plan)));
});

app.get("/api/investments/:id/installments", requireAuth, (req, res) => {
  const plan = getVisibleInvestmentPlans(req.user).find((item) => item.id === req.params.id);
  if (!plan) return res.status(404).json(errorResponse("Plano financeiro nao encontrado"));
  const items = databaseService.getState().installments
    .filter((item) => item.investmentPlanId === plan.id || item.planId === plan.id)
    .sort((a, b) => Number(a.number) - Number(b.number));
  res.json(successResponse(items));
});

app.get("/api/investments/:id/payments", requireAuth, (req, res) => {
  const plan = getVisibleInvestmentPlans(req.user).find((item) => item.id === req.params.id);
  if (!plan) return res.status(404).json(errorResponse("Plano financeiro nao encontrado"));
  
  const installments = databaseService.getState().installments
    .filter((item) => item.investmentPlanId === plan.id || item.planId === plan.id)
    .sort((a, b) => Number(a.number) - Number(b.number));
  
  const payments = [];
  
  // Add down payment as first payment if it exists
  if (plan.downPayment && plan.downPayment > 0) {
    payments.push({
      id: `downpayment-${plan.id}`,
      investmentPlanId: plan.id,
      type: 'DOWN_PAYMENT',
      amount: Number(plan.downPayment),
      dueDate: plan.downPaymentDate || plan.createdAt,
      paidAt: plan.downPaymentStatus === 'PAID' ? (plan.downPaymentDate || plan.createdAt) : null,
      status: plan.downPaymentStatus || 'PENDING',
      paymentMethod: plan.paymentMethod,
    });
  }
  
  // Add installments
  installments.forEach((inst) => {
    payments.push({
      id: inst.id,
      investmentPlanId: plan.id,
      type: 'INSTALLMENT',
      number: inst.number,
      amount: Number(inst.amount),
      dueDate: inst.dueDate,
      paidAt: inst.paidAt || null,
      status: inst.status,
      paymentMethod: plan.paymentMethod,
    });
  });
  
  res.json(successResponse(payments));
});

app.post("/api/investments/:id/installments", requireAuth, requireRole("ADMIN"), validateBody(installmentSchema), async (req, res) => {
  const db = databaseService.getState();
  const plan = db.investmentPlans.find((item) => item.id === req.params.id);
  if (!plan) return res.status(404).json(errorResponse("Plano financeiro nao encontrado"));

  const installment = {
    id: databaseService.createObjectId(),
    investmentPlanId: plan.id,
    planId: plan.id,
    ...req.body,
  };

  db.installments.push(installment);
  await databaseService.insertDocument("installments", installment);
  res.status(201).json(successResponse(installment));
});

app.patch("/api/installments/:id", requireAuth, requireRole("ADMIN"), validateBody(installmentPatchSchema), async (req, res) => {
  const db = databaseService.getState();
  const installment = db.installments.find((item) => item.id === req.params.id);
  if (!installment) return res.status(404).json(errorResponse("Parcela nao encontrada"));

  Object.assign(installment, req.body);
  await databaseService.replaceDocument("installments", installment);
  res.json(successResponse(installment));
});

app.delete("/api/installments/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const db = databaseService.getState();
  const index = db.installments.findIndex((item) => item.id === req.params.id);
  if (index < 0) return res.status(404).json(errorResponse("Parcela nao encontrada"));

  db.installments.splice(index, 1);
  await databaseService.deleteDocument("installments", req.params.id);
  res.status(204).send();
});

function getVisiblePlans(user) {
  const plans = databaseService.getState().plans || [];
  if (user.role === "ADMIN") return plans;
  return plans.filter((plan) => {
    const project = databaseService.getState().projects?.find((p) => p.id === plan.projectId);
    return project && project.clientId === user.id;
  });
}

function findPlanForUser(planId, user) {
  return getVisiblePlans(user).find((plan) => plan.id === planId);
}

function withPlanCalculations(plan) {
  const payments = databaseService.getState().planPayments
    .filter((item) => item.planId === plan.id)
    .sort((a, b) => Number(a.number) - Number(b.number));
  const paidPayments = payments.filter((item) => item.status === "PAID").length;
  const paidAmount = roundCurrency(payments
    .filter((item) => item.status === "PAID")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0));
  const totalExpected = payments.length > 0
    ? payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    : plan.amount;

  return {
    ...plan,
    payments,
    paidAmount,
    remainingAmount: roundCurrency(Math.max(totalExpected - paidAmount, 0)),
    paidPayments,
    remainingPayments: Math.max(payments.length - paidPayments, 0),
    progressPercent: totalExpected > 0 ? Math.round((paidAmount / totalExpected) * 100) : 0,
  };
}

app.get("/api/plans", requireAuth, (req, res) => {
  res.json(successResponse(getVisiblePlans(req.user).map(withPlanCalculations)));
});

app.get("/api/plans/:id", requireAuth, (req, res) => {
  const plan = findPlanForUser(req.params.id, req.user);
  if (!plan) return res.status(404).json(errorResponse("Plano nao encontrado"));
  res.json(successResponse(withPlanCalculations(plan)));
});

app.post("/api/plans", requireAuth, requireRole("ADMIN"), validateBody(planSchema), async (req, res) => {
  const db = databaseService.getState();
  const project = db.projects.find((item) => item.id === req.body.projectId);
  if (!project) return res.status(404).json(errorResponse("Projeto nao encontrado"));
  const existingPlan = db.plans.find((item) => item.projectId === project.id);
  if (existingPlan) {
    return res.status(409).json(errorResponse("Projeto ja possui um plano cadastrado"));
  }
  if (req.body.clientId && req.body.clientId !== project.clientId) {
    return res.status(400).json(errorResponse("Cliente do plano deve ser o mesmo cliente do projeto"));
  }

  const now = new Date().toISOString();
  const plan = {
    id: databaseService.createObjectId(),
    projectId: project.id,
    projectName: project.name,
    clientId: req.body.clientId || project.clientId,
    name: req.body.name,
    description: req.body.description || "",
    amount: req.body.amount,
    billingCycle: req.body.billingCycle || "MONTHLY",
    startDate: req.body.startDate,
    endDate: req.body.endDate || null,
    status: req.body.status || "ACTIVE",
    includedItems: req.body.includedItems || [],
    extraCosts: req.body.extraCosts || [],
    payments: [],
    createdAt: now,
    updatedAt: now,
  };

  db.plans.push(plan);
  await databaseService.insertDocument("plans", plan);
  res.status(201).json(successResponse(withPlanCalculations(plan)));
});

app.get("/api/plans/:id/payments", requireAuth, (req, res) => {
  const plan = findPlanForUser(req.params.id, req.user);
  if (!plan) return res.status(404).json(errorResponse("Plano nao encontrado"));
  const items = databaseService.getState().planPayments
    .filter((item) => item.planId === plan.id)
    .sort((a, b) => Number(a.number) - Number(b.number));
  res.json(successResponse(items));
});

app.post("/api/plans/:id/payments", requireAuth, requireRole("ADMIN"), validateBody(planPaymentSchema), async (req, res) => {
  const db = databaseService.getState();
  const plan = db.plans.find((item) => item.id === req.params.id);
  if (!plan) return res.status(404).json(errorResponse("Plano nao encontrado"));

  const payment = {
    id: databaseService.createObjectId(),
    planId: plan.id,
    ...req.body,
  };

  db.planPayments.push(payment);
  await databaseService.insertDocument("planPayments", payment);
  res.status(201).json(successResponse(payment));
});

app.patch("/api/planPayments/:id", requireAuth, requireRole("ADMIN"), validateBody(planPaymentPatchSchema), async (req, res) => {
  const db = databaseService.getState();
  const payment = db.planPayments.find((item) => item.id === req.params.id);
  if (!payment) return res.status(404).json(errorResponse("Pagamento de plano nao encontrado"));

  Object.assign(payment, req.body);
  await databaseService.replaceDocument("planPayments", payment);
  res.json(successResponse(payment));
});

app.delete("/api/planPayments/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const db = databaseService.getState();
  const index = db.planPayments.findIndex((item) => item.id === req.params.id);
  if (index < 0) return res.status(404).json(errorResponse("Pagamento de plano nao encontrado"));

  db.planPayments.splice(index, 1);
  await databaseService.deleteDocument("planPayments", req.params.id);
  res.status(204).send();
});

app.get("/api/pending", requireAuth, (req, res) => {
  const items = getVisiblePending(req.user).sort(sortNewest);
  res.json(successResponse(items));
});

app.get("/api/pending/:id", requireAuth, (req, res) => {
  const pending = findPendingForUser(req.params.id, req.user);
  if (!pending) return res.status(404).json(errorResponse("Pendencia nao encontrada"));
  res.json(successResponse(pending));
});

app.patch("/api/pending/:id/read", requireAuth, validateBody(pendingReadSchema), async (req, res) => {
  const pending = findPendingForUser(req.params.id, req.user);
  if (!pending) return res.status(404).json(errorResponse("Pendencia nao encontrada"));

  pending.isRead = req.body.read;
  pending.read = req.body.read;
  pending.updatedAt = new Date().toISOString();
  await databaseService.replaceDocument("pending", pending);
  res.json(successResponse(pending));
});

app.post("/api/pending/:id/responses", requireAuth, validateBody(pendingResponseSchema), async (req, res) => {
  const pending = findPendingForUser(req.params.id, req.user);
  if (!pending) return res.status(404).json(errorResponse("Pendencia nao encontrada"));
  if (String(pending.status).toUpperCase() !== "PENDING") {
    return res.status(409).json(errorResponse("Pendencia nao aceita novas respostas neste status"));
  }

  const validationError = validatePendingRequiredFields(pending, req.body.responses);
  if (validationError) {
    return res.status(400).json(errorResponse(validationError));
  }

  const now = new Date().toISOString();
  pending.responses = req.body.responses.map((response) => {
    const field = pending.fields.find((item) => item.id === response.fieldId);
    return {
      fieldId: response.fieldId,
      label: field?.label || response.fieldId,
      value: response.value ?? null,
      files: [],
    };
  });
  pending.fields = pending.fields.map((field) => {
    const response = req.body.responses.find((item) => item.fieldId === field.id);
    return response ? { ...field, value: response.value ?? null } : field;
  });
  pending.status = "RESPONDED";
  pending.isRead = true;
  pending.read = true;
  pending.respondedAt = now;
  pending.updatedAt = now;

  await databaseService.replaceDocument("pending", pending);
  res.status(201).json(successResponse(pending));
});

app.get("/api/notifications", requireAuth, async (req, res) => {
  await ensurePlanRenewalNotifications(req.user);
  const db = databaseService.getState();
  const items = db.notifications
    .filter((item) => req.user.role === "ADMIN" || item.userId === req.user.id)
    .sort(sortNewest);
  res.json(successResponse(items));
});

app.patch("/api/notifications/:id/read", requireAuth, validateBody(notificationReadSchema), async (req, res) => {
  const db = databaseService.getState();
  const notification = db.notifications.find((item) => item.id === req.params.id);
  if (!notification || (req.user.role !== "ADMIN" && notification.userId !== req.user.id)) {
    return res.status(404).json(errorResponse("Notificacao nao encontrada"));
  }

  notification.read = req.body.read;
  await databaseService.replaceDocument("notifications", notification);
  res.json(successResponse(notification));
});

app.use((_req, res) => {
  res.status(404).json(errorResponse("Rota nao encontrada"));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json(errorResponse("Erro interno do servidor"));
});

function isSecureCookieRuntime() {
  const runtime = (process.env.APP_ENV || process.env.NODE_ENV || "").toLowerCase();
  return !["local", "development", "test"].includes(runtime);
}

function isLocalRuntime() {
  const runtime = (process.env.APP_ENV || process.env.NODE_ENV || "").toLowerCase();
  return ["local", "development", "test"].includes(runtime);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function parseCookies(header = "") {
  return header.split(";").reduce((cookies, part) => {
    const [rawName, ...valueParts] = part.trim().split("=");
    if (!rawName) return cookies;
    cookies[rawName] = decodeURIComponent(valueParts.join("=") || "");
    return cookies;
  }, {});
}

function serializeCookie(name, value, options = {}) {
  const segments = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) segments.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
  if (options.path) segments.push(`Path=${options.path}`);
  if (options.httpOnly) segments.push("HttpOnly");
  if (options.secure) segments.push("Secure");
  if (options.sameSite) segments.push(`SameSite=${options.sameSite}`);
  return segments.join("; ");
}

function setAuthCookies(res, token, csrfToken) {
  res.append("Set-Cookie", serializeCookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecureCookieRuntime(),
    sameSite: "Lax",
    path: "/api",
    maxAge: SESSION_MAX_AGE_MS,
  }));
  res.append("Set-Cookie", serializeCookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: isSecureCookieRuntime(),
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  }));
}

function clearAuthCookies(res) {
  res.append("Set-Cookie", serializeCookie(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isSecureCookieRuntime(),
    sameSite: "Lax",
    path: "/api",
    maxAge: 0,
  }));
  res.append("Set-Cookie", serializeCookie(CSRF_COOKIE_NAME, "", {
    httpOnly: false,
    secure: isSecureCookieRuntime(),
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
  }));
}

function getRequestHost(req) {
  return req.headers["x-vercel-forwarded-host"] || req.headers["x-forwarded-host"] || req.headers.host;
}

function isSameOrigin(req, origin) {
  const host = getRequestHost(req);
  if (!origin || !host) return false;
  return origin.replace(/^https?:\/\//, "").toLowerCase() === String(host).toLowerCase();
}

function signToken(user, csrfToken) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, csrfToken }, JWT_SECRET, { expiresIn: "8h" });
}

function getRequestToken(req) {
  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (cookieToken) {
    req.authSource = "cookie";
    return cookieToken;
  }
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    req.authSource = "bearer";
    return authHeader.split(" ")[1];
  }
  return "";
}

function requireAuth(req, res, next) {
  const token = getRequestToken(req);
  if (!token) return res.status(401).json(errorResponse("Sessao nao autenticada"));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = databaseService.getState().users.find((item) => item.id === decoded.id);
    if (!user || user.active === false) {
      clearAuthCookies(res);
      return res.status(401).json(errorResponse("Sessao nao autenticada"));
    }
    req.user = user;
    req.session = decoded;
    requireCsrf(req, res, next);
  } catch {
    clearAuthCookies(res);
    res.status(401).json(errorResponse("Sessao invalida ou expirada"));
  }
}

function requireCsrf(req, res, next) {
  const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (!mutatingMethods.includes(req.method) || req.authSource !== "cookie") {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get("X-CSRF-Token");
  const sessionToken = req.session?.csrfToken;

  if (!cookieToken || !headerToken || !sessionToken || cookieToken !== headerToken || headerToken !== sessionToken) {
    return res.status(403).json(errorResponse("Falha na validacao de seguranca da sessao"));
  }

  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json(errorResponse("Acesso negado"));
    }
    next();
  };
}

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

function successResponse(data) {
  return { success: true, data };
}

function errorResponse(message) {
  return { success: false, message };
}

function findClientUser(clientId) {
  return databaseService.getState().users.find((user) => user.id === clientId && user.role === "CLIENT");
}

function getClientSettingsForUser(user) {
  const settings = databaseService.getState().clientSettings
    .find((item) => item.clientId === user.id);

  return settings || buildClientSettingsDefaults(user);
}

async function upsertClientSettings(user, patch) {
  const db = databaseService.getState();
  const existingSettings = db.clientSettings.find((item) => item.clientId === user.id);
  const now = new Date().toISOString();
  const baseSettings = existingSettings || buildClientSettingsDefaults(user);
  const nextSettings = mergeClientSettings(baseSettings, patch);

  nextSettings.updatedAt = now;

  if (existingSettings) {
    Object.assign(existingSettings, nextSettings);
    await databaseService.replaceDocument("clientSettings", existingSettings);
    return existingSettings;
  }

  nextSettings.createdAt = now;
  nextSettings.updatedAt = now;
  db.clientSettings.push(nextSettings);
  await databaseService.insertDocument("clientSettings", nextSettings);
  return nextSettings;
}

function buildClientSettingsDefaults(user) {
  const now = new Date().toISOString();

  return {
    id: databaseService.createObjectId(),
    clientId: user.id,
    companyProfile: {
      displayName: user.company || user.name || "",
      cnpj: "",
      phone: user.phone || "",
      commercialEmail: user.email || "",
      address: "",
      logoUrl: "",
      brandColor: "#c8102e",
    },
    notifications: {
      newProjects: true,
      releases: true,
      pendingItems: true,
      installments: true,
      passwordRecovery: true,
      meetings: true,
    },
    meetingPreferences: {
      availableStartTime: "09:00",
      availableEndTime: "18:00",
      reminderMinutes: 60,
    },
    createdAt: now,
    updatedAt: now,
  };
}

function mergeClientSettings(settings, patch) {
  return {
    ...settings,
    companyProfile: {
      ...settings.companyProfile,
      ...trimStringValues(patch.companyProfile),
    },
    notifications: {
      ...settings.notifications,
      ...(patch.notifications || {}),
    },
    meetingPreferences: {
      ...settings.meetingPreferences,
      ...(patch.meetingPreferences || {}),
    },
  };
}

function trimStringValues(value) {
  if (!value) return {};

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      typeof item === "string" ? item.trim() : item,
    ]),
  );
}

function getVisibleProjects(user) {
  const projects = databaseService.getState().projects || [];
  if (user.role === "ADMIN") return projects;
  return projects.filter((project) => project.clientId === user.id);
}

function findProjectForUser(projectId, user) {
  return getVisibleProjects(user).find((project) => project.id === projectId);
}

function getVisibleInvestmentPlans(user) {
  const plans = databaseService.getState().investmentPlans || [];
  if (user.role === "ADMIN") return plans;
  return plans.filter((plan) => plan.clientId === user.id);
}

function getVisiblePending(user) {
  const pending = databaseService.getState().pending || [];
  if (user.role === "ADMIN") return pending;
  return pending.filter((item) => item.clientId === user.id);
}

function findPendingForUser(pendingId, user) {
  return getVisiblePending(user).find((item) => item.id === pendingId);
}

function validatePendingRequiredFields(pending, responses) {
  const responseByField = new Map(responses.map((response) => [response.fieldId, response]));
  const missingField = (pending.fields || [])
    .filter((field) => String(field.type).toUpperCase() !== "FILE")
    .filter((field) => field.required)
    .find((field) => {
      const response = responseByField.get(field.id);
      return response?.value === undefined || response.value === null || String(response.value).trim().length === 0;
    });

  if (missingField) {
    return `Campo obrigatorio nao preenchido: ${missingField.label}`;
  }

  const pendingStatus = String(pending.status).toUpperCase();
  if (!PENDING_STATUSES.includes(pendingStatus)) {
    return "Status da pendencia invalido";
  }

  return "";
}

async function updateProject(req, res) {
  const db = databaseService.getState();
  const project = db.projects.find((item) => item.id === req.params.id);
  if (!project) return res.status(404).json(errorResponse("Projeto nao encontrado"));

  const previousStatus = project.status;
  Object.assign(project, req.body, { updatedAt: new Date().toISOString() });
  const changedPrimaryProjects = project.isPrimary ? clearPrimaryProjects(db, project.clientId, project.id) : [];
  if (previousStatus !== project.status) {
    addActivity(db, project.id, "STATUS_CHANGED", "Status atualizado", `Status alterado para ${project.status}.`);
  } else {
    addActivity(db, project.id, "PROJECT_UPDATED", "Projeto atualizado", "Informacoes do projeto atualizadas.");
  }
  await databaseService.replaceDocuments("projects", changedPrimaryProjects);
  await databaseService.replaceDocument("projects", project);
  await databaseService.insertDocument("projectActivities", db.projectActivities.at(-1));
  res.json(successResponse(project));
}

function clearPrimaryProjects(db, clientId, exceptProjectId = "") {
  const changedProjects = db.projects
    .filter((project) => project.clientId === clientId && project.id !== exceptProjectId)
    .filter((project) => project.isPrimary);

  changedProjects.forEach((project) => {
      project.isPrimary = false;
      project.updatedAt = new Date().toISOString();
    });

  return changedProjects;
}

function addActivity(db, projectId, type, title, description) {
  if (!ACTIVITY_TYPES.includes(type)) return;
  db.projectActivities.push({
    id: databaseService.createObjectId(),
    projectId,
    type,
    title,
    description,
    createdAt: new Date().toISOString(),
  });
}

function withInvestmentCalculations(plan) {
  const installments = databaseService.getState().installments
    .filter((item) => item.investmentPlanId === plan.id || item.planId === plan.id);
  const paidInstallments = installments.filter((item) => item.status === "PAID").length;
  const installmentsPaidAmount = roundCurrency(installments
    .filter((item) => item.status === "PAID")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0));
  const downPaymentPaid = (plan.downPaymentStatus === "PAID" && plan.downPayment) ? Number(plan.downPayment) : 0;
  const paidAmount = roundCurrency(installmentsPaidAmount + downPaymentPaid);
  const totalAmount = Number(plan.totalAmount || 0);
  const remainingAmount = roundCurrency(Math.max(totalAmount - paidAmount, 0));
  const remainingInstallments = Math.max(Number(plan.installments || 0) - paidInstallments, 0);
  const derivedStatus = remainingAmount === 0 ? "PAID" : (paidAmount > 0 ? "PARTIALLY_PAID" : (plan.status === "PENDING" ? "PENDING" : "ACTIVE"));

  return {
    ...plan,
    paidAmount,
    remainingAmount,
    paidInstallments,
    remainingInstallments,
    status: derivedStatus,
  };
}

function roundCurrency(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function sortNewest(a, b) {
  return new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0);
}

function sortReleasedNewest(a, b) {
  return new Date(b.releasedAt || b.createdAt || 0) - new Date(a.releasedAt || a.createdAt || 0);
}

async function ensurePlanRenewalNotifications(user) {
  const db = databaseService.getState();
  const visiblePlans = getVisiblePlans(user);
  db.notifications = db.notifications || [];
  const notifications = db.notifications;
  const now = new Date().toISOString();

  for (const plan of visiblePlans) {
    const daysUntilEnd = getDaysUntilPlanEnd(plan);
    const clientId = plan.clientId || db.projects?.find((project) => project.id === plan.projectId)?.clientId;

    if (!clientId || !isPlanInFinalMonth(daysUntilEnd) || !["ACTIVE", "PAUSED"].includes(plan.status)) {
      continue;
    }

    const alreadyExists = notifications.some((notification) =>
      notification.type === "PLAN_RENEWAL_DUE" &&
      notification.userId === clientId &&
      notification.relatedEntityId === plan.id
    );

    if (alreadyExists) {
      continue;
    }

    const notification = {
      id: databaseService.createObjectId(),
      userId: clientId,
      title: "Renovação de plano necessária",
      message: buildPlanRenewalMessage(plan, daysUntilEnd),
      type: "PLAN_RENEWAL_DUE",
      relatedEntityType: "PLAN",
      relatedEntityId: plan.id,
      priority: "HIGH",
      metadata: {
        planId: plan.id,
        projectId: plan.projectId,
        projectName: plan.projectName,
        daysUntilEnd,
      },
      read: false,
      createdAt: now,
    };

    notifications.push(notification);
    await databaseService.insertDocument("notifications", notification);
  }
}

function getDaysUntilPlanEnd(plan) {
  if (!plan.endDate) return null;
  const endDate = new Date(plan.endDate);
  if (Number.isNaN(endDate.getTime())) return null;

  const now = new Date();
  return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function isPlanInFinalMonth(daysUntilEnd) {
  return daysUntilEnd !== null && daysUntilEnd >= 0 && daysUntilEnd <= 31;
}

function buildPlanRenewalMessage(plan, daysUntilEnd) {
  if (daysUntilEnd === 0) {
    return `Este é o último dia do ${plan.name}. Entre em contato com o suporte e renove para continuar com os serviços.`;
  }

  if (daysUntilEnd === 1) {
    return `Este é o último mês do ${plan.name}. Ele termina em 1 dia. Entre em contato com o suporte e renove para continuar com os serviços.`;
  }

  return `Este é o último mês do ${plan.name}. Ele termina em ${daysUntilEnd} dias. Entre em contato com o suporte e renove para continuar com os serviços.`;
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Maiawall Homolog API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
