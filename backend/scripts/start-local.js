process.env.NODE_ENV = "local";
process.env.APP_ENV = "local";
process.env.PORT = process.env.PORT || "3000";
process.env.JWT_SECRET = process.env.JWT_SECRET || "change-me-local-only";
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
process.env.MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "maiawall_homolog_local";

const app = require("../server");
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Maiawall Homolog API local running on http://localhost:${port}`);
});
