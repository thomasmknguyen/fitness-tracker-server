const mysql = require("mysql");
require("dotenv/config");

const connection = mysql.createPool({
  host: process.env.REACT_APP_DB_HOST,
  user: process.env.REACT_APP_DB_USER,
  password: process.env.REACT_APP_DB_PASS,
  database: process.env.REACT_APP_DB_DATABASE,
});

module.exports = connection;
