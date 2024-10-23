import mysql from "mysql2/promise";
import config from "../config.js";

const connection = await mysql.createConnection({
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.database,
});

try {
  await connection.connect();
  console.log("Connected to the database!");
} catch (error) {
  console.error("Error connecting to the database:", error);
}

export const getConnection = () => {
  return connection;
};
