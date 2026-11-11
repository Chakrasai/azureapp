const sql = require("mssql");
require("dotenv").config();

const config = {
    user: process.env.AZURE_SQL_USER,
    password: process.env.AZURE_SQL_PASSWORD,
    server: process.env.AZURE_SQL_SERVER,
    database: process.env.AZURE_SQL_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then((pool) => {
        console.log("Connected to Azure SQL Database");
        return pool;
    })
    .catch((err) => {
        console.error("Database connection failed:", err);
        throw err;
    });

module.exports = { sql, poolPromise };
