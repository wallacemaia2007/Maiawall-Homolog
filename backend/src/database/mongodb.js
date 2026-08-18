const { MongoClient } = require("mongodb");
const { assertSafeDatabaseConfig } = require("../config/environmentGuard");

let clientPromise = null;
let dbPromise = null;

function getMongoUri() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGODB_URI nao definida");
  }
  return uri;
}

function getDatabaseName() {
  return process.env.MONGODB_DB_NAME || process.env.MONGO_DB_NAME || "maiawall_homolog";
}

function getClient() {
  if (!clientPromise) {
    assertSafeDatabaseConfig();
    const client = new MongoClient(getMongoUri());
    clientPromise = client.connect();
  }
  return clientPromise;
}

async function getDb() {
  if (!dbPromise) {
    dbPromise = getClient().then((client) => client.db(getDatabaseName()));
  }
  return dbPromise;
}

async function closeMongoConnection() {
  if (!clientPromise) return;
  const client = await clientPromise;
  await client.close();
  clientPromise = null;
  dbPromise = null;
}

module.exports = { getClient, getDb, closeMongoConnection };
