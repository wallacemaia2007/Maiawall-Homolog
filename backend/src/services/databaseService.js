const { ObjectId } = require("mongodb");
const { MongoRepository } = require("../repositories/mongoRepository");

const COLLECTIONS = [
  "users",
  "projects",
  "projectActivities",
  "projectReleases",
  "projectCommits",
  "investmentPlans",
  "plans",
  "planPayments",
  "installments",
  "notifications",
  "pending",
  "clientSettings",
  "passwordRecoveryTokens",
];

const KEEP_DOMAIN_ID = new Set();

const repositories = new Map(
  COLLECTIONS.map((name) => [name, new MongoRepository(name)]),
);

let state = createEmptyState();
let loaded = false;

function createEmptyState() {
  return COLLECTIONS.reduce((acc, collection) => {
    acc[collection] = [];
    return acc;
  }, {});
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toApiDocument(document, collectionName) {
  const apiDocument = clone(document);
  const mongoId = apiDocument._id?.toString?.() || apiDocument._id;
  delete apiDocument._id;

  if (!KEEP_DOMAIN_ID.has(collectionName)) {
    apiDocument.id = mongoId;
  }

  return apiDocument;
}

function toMongoDocument(document, collectionName) {
  const mongoDocument = clone(document);

  if (!KEEP_DOMAIN_ID.has(collectionName)) {
    const id = mongoDocument.id;
    delete mongoDocument.id;
    if (typeof id === "string" && ObjectId.isValid(id)) {
      mongoDocument._id = new ObjectId(id);
    }
  }

  return mongoDocument;
}

async function loadState() {
  const nextState = createEmptyState();

  await Promise.all(
    COLLECTIONS.map(async (collectionName) => {
      const repository = repositories.get(collectionName);
      const documents = await repository.findAll();
      nextState[collectionName] = documents.map((document) =>
        toApiDocument(document, collectionName),
      );
    }),
  );

  state = nextState;
  loaded = true;
  return state;
}

async function ensureLoaded() {
  if (!loaded) {
    await loadState();
  }
  return state;
}

function getState() {
  return state;
}

async function insertDocument(collectionName, document) {
  const repository = getRepository(collectionName);
  const mongoDocument = toMongoDocument(document, collectionName);
  await repository.insertOne(mongoDocument);
}

async function replaceDocument(collectionName, document) {
  const repository = getRepository(collectionName);
  const mongoDocument = toMongoDocument(document, collectionName);
  await repository.replaceOneById(document.id, mongoDocument);
}

async function replaceDocuments(collectionName, documents) {
  for (const document of documents) {
    await replaceDocument(collectionName, document);
  }
}

async function deleteDocument(collectionName, id) {
  const repository = getRepository(collectionName);
  await repository.deleteOneById(id);
}

async function deleteDocumentsByField(collectionName, fieldName, value) {
  const repository = getRepository(collectionName);
  await repository.deleteMany({ [fieldName]: value });
}

function getRepository(collectionName) {
  const repository = repositories.get(collectionName);
  if (!repository) throw new Error(`Colecao nao configurada: ${collectionName}`);
  return repository;
}

function createObjectId() {
  return new ObjectId().toHexString();
}

function getCollectionNames() {
  return [...COLLECTIONS];
}

module.exports = {
  ensureLoaded,
  getCollectionNames,
  getState,
  insertDocument,
  replaceDocument,
  replaceDocuments,
  deleteDocument,
  deleteDocumentsByField,
  createObjectId,
  toApiDocument,
  toMongoDocument,
};
