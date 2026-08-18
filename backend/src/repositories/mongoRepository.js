const { ObjectId } = require("mongodb");
const { getDb } = require("../database/mongodb");

class MongoRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async collection() {
    const db = await getDb();
    return db.collection(this.collectionName);
  }

  async findAll() {
    const collection = await this.collection();
    return collection.find({}).toArray();
  }

  async count() {
    const collection = await this.collection();
    return collection.countDocuments();
  }

  async insertOne(document) {
    const collection = await this.collection();
    const result = await collection.insertOne(document);
    return collection.findOne({ _id: result.insertedId });
  }

  async replaceOneById(id, document) {
    const collection = await this.collection();
    const objectId = objectIdFrom(id);
    if (!objectId) throw new Error(`ID invalido para ${this.collectionName}`);

    await collection.replaceOne({ _id: objectId }, document, { upsert: true });
    return collection.findOne({ _id: objectId });
  }

  async deleteOneById(id) {
    const collection = await this.collection();
    const objectId = objectIdFrom(id);
    if (!objectId) throw new Error(`ID invalido para ${this.collectionName}`);

    return collection.deleteOne({ _id: objectId });
  }

  async deleteMany(filter) {
    const collection = await this.collection();
    return collection.deleteMany(filter);
  }
}

function objectIdFrom(value) {
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && ObjectId.isValid(value)) {
    return new ObjectId(value);
  }
  return null;
}

module.exports = { MongoRepository, objectIdFrom };
