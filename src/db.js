const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.sqlite");

db.run(`
  CREATE TABLE IF NOT EXISTS ignored_roles (
    role_name TEXT PRIMARY KEY
  )
`);

db.run(
  "INSERT OR IGNORE INTO ignored_roles (role_name) VALUES (?)",
  ["Developer"]
);

module.exports = db;