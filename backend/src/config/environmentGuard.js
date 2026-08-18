const LOCAL_ENVIRONMENTS = new Set(["dev", "development", "local", "test"]);
const PROD_DATABASE_NAMES = new Set(["maiawall_homolog", "maiawall_prod", "production", "prod"]);

function getAppEnvironment() {
  return (process.env.APP_ENV || process.env.NODE_ENV || "local").toLowerCase();
}

function isLocalEnvironment(environment = getAppEnvironment()) {
  return LOCAL_ENVIRONMENTS.has(String(environment).toLowerCase());
}

function isRemoteMongoUri(uri) {
  if (!uri) return false;
  const normalized = uri.toLowerCase();

  if (normalized.startsWith("mongodb+srv://")) return true;
  if (normalized.includes("mongodb.net")) return true;

  try {
    const parsed = new URL(uri);
    const hostname = parsed.hostname.toLowerCase();
    return !["localhost", "127.0.0.1", "::1", "host.docker.internal"].includes(hostname);
  } catch {
    return true;
  }
}

function assertSafeDatabaseConfig() {
  const environment = getAppEnvironment();
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
  const databaseName = process.env.MONGODB_DB_NAME || process.env.MONGO_DB_NAME || "maiawall_homolog";

  if (!isLocalEnvironment(environment)) return;

  if (PROD_DATABASE_NAMES.has(databaseName.toLowerCase())) {
    throw new Error(
      `Config local insegura: MONGODB_DB_NAME="${databaseName}" parece ser banco de producao. Use "maiawall_homolog_local".`,
    );
  }

  if (
    isRemoteMongoUri(mongoUri) &&
    process.env.ALLOW_REMOTE_MONGO_IN_LOCAL !== "true"
  ) {
    throw new Error(
      "Config local insegura: MONGODB_URI aponta para Mongo remoto. Use mongodb://127.0.0.1:27017 ou defina ALLOW_REMOTE_MONGO_IN_LOCAL=true conscientemente.",
    );
  }
}

function getRuntimeInfo() {
  return {
    environment: getAppEnvironment(),
    isLocal: isLocalEnvironment(),
    database: process.env.MONGODB_DB_NAME || process.env.MONGO_DB_NAME || "maiawall_homolog",
  };
}

module.exports = {
  assertSafeDatabaseConfig,
  getRuntimeInfo,
  isLocalEnvironment,
  isRemoteMongoUri,
};
