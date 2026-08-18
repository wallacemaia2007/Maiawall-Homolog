require("dotenv").config({ path: __dirname + "/../.env" });

const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");
const { getDb, closeMongoConnection } = require("../src/database/mongodb");

const COLLECTIONS = [
  "users",
  "projects",
  "projectActivities",
  "projectReleases",
  "projectCommits",
  "investmentPlans",
  "installments",
  "notifications",
  "passwordRecoveryTokens",
];

function id() {
  return new ObjectId().toHexString();
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

async function main() {
  if (!process.env.MONGODB_URI && process.env.MONGO_URI) {
    process.env.MONGODB_URI = process.env.MONGO_URI;
  }

  assertSeedAllowed();

  const db = await getDb();
  const now = new Date().toISOString();

  const adminId = id();
  const clientId = id();
  const primaryProjectId = id();
  const homologProjectId = id();
  const planId = id();

  const users = [
    {
      id: adminId,
      name: "Wallace Maia",
      email: "admin@maiawall.com",
      passwordHash: await bcrypt.hash("Admin@123", 10),
      role: "ADMIN",
      avatarUrl: "",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: clientId,
      name: "Cliente Maiawall",
      email: "cliente@maiawall.com",
      passwordHash: await bcrypt.hash("Cliente@123", 10),
      role: "CLIENT",
      avatarUrl: "",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const projects = [
    {
      id: primaryProjectId,
      name: "Portal Institucional Maiawall",
      description: "Portal principal em homologacao para validacao do cliente.",
      imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80",
      clientId,
      isPrimary: true,
      status: "HOMOLOGATION",
      progress: 82,
      version: "v1.4.0",
      productionUrl: "https://maiawall.com",
      homologationUrl: "https://homolog.maiawall.com",
      repositoryUrl: "https://github.com/maiawall/portal",
      createdAt: daysAgo(40),
      updatedAt: now,
    },
    {
      id: homologProjectId,
      name: "Dashboard Operacional",
      description: "Area autenticada para acompanhamento de indicadores e entregas.",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80",
      clientId,
      isPrimary: false,
      status: "DEVELOPMENT",
      progress: 45,
      version: "v0.8.2",
      productionUrl: "",
      homologationUrl: "https://dashboard-homolog.maiawall.com",
      repositoryUrl: "https://github.com/maiawall/dashboard",
      createdAt: daysAgo(18),
      updatedAt: daysAgo(1),
    },
  ];

  const projectActivities = [
    {
      id: id(),
      projectId: primaryProjectId,
      type: "PROJECT_CREATED",
      title: "Projeto criado",
      description: "Kickoff do portal institucional concluido.",
      createdAt: daysAgo(40),
    },
    {
      id: id(),
      projectId: primaryProjectId,
      type: "VERSION_RELEASED",
      title: "Versao v1.4.0 publicada",
      description: "Nova area de servicos e ajustes mobile enviados para homologacao.",
      createdAt: daysAgo(3),
    },
    {
      id: id(),
      projectId: homologProjectId,
      type: "STATUS_CHANGED",
      title: "Desenvolvimento em andamento",
      description: "Fluxos internos do dashboard entraram em desenvolvimento.",
      createdAt: daysAgo(1),
    },
  ];

  const projectReleases = [
    {
      id: id(),
      projectId: primaryProjectId,
      version: "v1.4.0",
      title: "Homologacao do portal",
      description: "Pacote de melhorias visuais e responsivas.",
      changes: ["Nova secao de servicos", "Melhorias no formulario", "Correcoes mobile"],
      releasedAt: daysAgo(3),
    },
  ];

  const projectCommits = [
    {
      id: id(),
      projectId: primaryProjectId,
      sha: "7fd2a91",
      message: "Ajusta componentes principais da home",
      author: "Wallace Maia",
      createdAt: daysAgo(4),
      url: "https://github.com/",
    },
    {
      id: id(),
      projectId: homologProjectId,
      sha: "a03bc82",
      message: "Implementa estrutura inicial do dashboard",
      author: "Wallace Maia",
      createdAt: daysAgo(2),
      url: "https://github.com/",
    },
  ];

  const investmentPlans = [
    {
      id: planId,
      projectId: primaryProjectId,
      clientId,
      name: "Plano Portal Institucional",
      totalAmount: 3000,
      installments: 6,
      installmentAmount: 500,
      status: "ACTIVE",
      createdAt: daysAgo(40),
      updatedAt: now,
    },
  ];

  const installments = Array.from({ length: 6 }, (_, index) => ({
    id: id(),
    investmentPlanId: planId,
    planId,
    number: index + 1,
    amount: 500,
    dueDate: daysAgo(30 - index * 30),
    paidAt: index < 3 ? daysAgo(28 - index * 30) : null,
    status: index < 3 ? "PAID" : "PENDING",
  }));

  const notifications = [
    {
      id: id(),
      userId: clientId,
      title: "Nova versao disponivel",
      message: "A versao v1.4.0 do portal esta pronta para revisao.",
      type: "PROJECT",
      read: false,
      createdAt: daysAgo(3),
    },
  ];

  const data = {
    users,
    projects,
    projectActivities,
    projectReleases,
    projectCommits,
    investmentPlans,
    installments,
    notifications,
    passwordRecoveryTokens: [],
  };

  for (const collectionName of COLLECTIONS) {
    const collection = db.collection(collectionName);
    await collection.deleteMany({});
    if (data[collectionName].length > 0) {
      await collection.insertMany(data[collectionName].map(toMongoDocument));
    }
  }

  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("projects").createIndex({ clientId: 1 }),
    db.collection("projects").createIndex({ clientId: 1, isPrimary: 1 }),
    db.collection("investmentPlans").createIndex({ clientId: 1 }),
    db.collection("investmentPlans").createIndex({ projectId: 1 }),
    db.collection("installments").createIndex({ investmentPlanId: 1 }),
    db.collection("notifications").createIndex({ userId: 1 }),
    db.collection("passwordRecoveryTokens").createIndex({ email: 1 }),
    db.collection("passwordRecoveryTokens").createIndex({ tokenHash: 1 }, { unique: true }),
  ]);

  console.log("Seed Maiawall Homolog concluido.");
  console.log("ADMIN  admin@maiawall.com   Admin@123");
  console.log("CLIENT cliente@maiawall.com Cliente@123");
}

function assertSeedAllowed() {
  const environment = (process.env.APP_ENV || process.env.NODE_ENV || "local").toLowerCase();
  const databaseName = process.env.MONGODB_DB_NAME || process.env.MONGO_DB_NAME || "maiawall_homolog";
  const isLocal = ["local", "development", "dev", "test"].includes(environment);

  if (isLocal) return;

  const expectedConfirmation = `SEED ${databaseName}`;
  if (process.env.CONFIRM_SEED !== expectedConfirmation) {
    throw new Error(
      `Seed bloqueado para APP_ENV=${environment}. Defina CONFIRM_SEED="${expectedConfirmation}" para confirmar a limpeza das colecoes.`,
    );
  }
}

function toMongoDocument(document) {
  const { id: documentId, ...rest } = document;
  return {
    _id: new ObjectId(documentId),
    ...rest,
  };
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeMongoConnection();
  });
