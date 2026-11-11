const express = require("express");
const { sql, poolPromise } = require("./db");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/employees", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT * FROM Employees");

        res.json(result.recordset);
    } catch (err) {
        console.error("Employee lookup failed:", err);
        res.status(500).json({ error: "Database query failed" });
    }
});

app.post("/employees", async (req, res) => {
    try {
        const { name, department, salary } = req.body;
        if (!name || !department || salary === undefined || Number.isNaN(Number(salary))) {
            return res.status(400).json({ error: "Name, department, and a valid salary are required" });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("name", sql.VarChar(100), name)
            .input("department", sql.VarChar(100), department)
            .input("salary", sql.Decimal(10, 2), salary)
            .query(`
                INSERT INTO Employees
                (EmployeeName, Department, Salary)
                OUTPUT INSERTED.*
                VALUES (@name, @department, @salary)
            `);

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error("Employee insert failed:", err);
        res.status(500).json({ error: "Insert failed" });
    }
});

app.put("/employees/:id", async (req, res) => {
    try {
        const id = Number.parseInt(req.params.id, 10);
        const { name, department, salary } = req.body;

        if (!Number.isInteger(id) || !name || !department || salary === undefined || Number.isNaN(Number(salary))) {
            return res.status(400).json({ error: "A valid employee ID, name, department, and salary are required" });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input("id", sql.Int, id)
            .input("name", sql.VarChar(100), name)
            .input("department", sql.VarChar(100), department)
            .input("salary", sql.Decimal(10, 2), salary)
            .query(`
                UPDATE Employees
                SET EmployeeName = @name, Department = @department, Salary = @salary
                OUTPUT INSERTED.*
                WHERE EmployeeID = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error("Employee update failed:", err);
        res.status(500).json({ error: "Update failed" });
    }
});

app.delete("/employees/:id", async (req, res) => {
    try {
        const id = Number.parseInt(req.params.id, 10);
        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: "A valid employee ID is required" });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                DELETE FROM Employees
                OUTPUT DELETED.*
                WHERE EmployeeID = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.status(204).end();
    } catch (err) {
        console.error("Employee delete failed:", err);
        res.status(500).json({ error: "Delete failed" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
