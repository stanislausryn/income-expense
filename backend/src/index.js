const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

console.log("DEBUG: DB Config:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  passType: typeof process.env.DB_PASS,
  passExists: !!process.env.DB_PASS,
  passVal: process.env.DB_PASS
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS ? String(process.env.DB_PASS) : "",
  database: process.env.DB_NAME,
});

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(10) NOT NULL, -- 'income' or 'expense'
        amount INT NOT NULL,
        category VARCHAR(50) NOT NULL,
        account VARCHAR(50),
        note TEXT,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS savings_plans (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        target_amount INT NOT NULL,
        current_amount INT DEFAULT 0,
        target_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bills (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        amount INT NOT NULL,
        due_date DATE NOT NULL,
        is_paid BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database tables checked/created.");
  } catch (err) {
    console.error("Error creating tables:", err);
  }
})();

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}


app.get("/", (req, res) => {
  res.json({ message: "Backend running!" });
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`DEBUG: Login attempt for '${username}'`);

    const result = await pool.query("SELECT * FROM users WHERE username=$1", [username]);

    if (result.rows.length === 0) {
      console.log("DEBUG: User not found");
      return res.status(401).json({ error: "Invalid username/password" });
    }

    const user = result.rows[0];
    console.log("DEBUG: User found:", { id: user.id, username: user.username, hasPassword: !!user.password, hasPasswordHash: !!user.password_hash });

    const storedHash = user.password_hash || user.password;

    if (!storedHash) {
      console.error("CRITICAL: User record has no password hash!");
      return res.status(500).json({ error: "User record corrupted" });
    }

    const match = await bcrypt.compare(password, storedHash);
    if (!match) {
      console.log("DEBUG: Password mismatch.");
      return res.status(401).json({ error: "Invalid username/password" });
    }

    const token = jwt.sign(
      { user_id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Login failed: " + err.message });
  }
});


app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const existing = await pool.query("SELECT * FROM users WHERE username=$1", [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
      [username, hash]
    );

    res.json({ message: "User created", user: result.rows[0] });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});


app.post("/reset", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    await pool.query("DELETE FROM transactions WHERE user_id=$1", [userId]);
    await pool.query("DELETE FROM bills WHERE user_id=$1", [userId]);
    await pool.query("DELETE FROM savings_plans WHERE user_id=$1", [userId]);
    res.json({ message: "Data reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset data" });
  }
});

app.post("/transactions", authMiddleware, async (req, res) => {
  try {
    const { type, amount, category, note, date, account } = req.body;
    const userId = req.user.user_id;

    const result = await pool.query(
      "INSERT INTO transactions (user_id, type, amount, category, note, date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [userId, type, amount, category, note, date]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to insert transaction" });
  }
});

app.get("/transactions", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { month } = req.query;

    let query = "SELECT * FROM transactions WHERE user_id=$1";
    let params = [userId];

    if (month) {
      query += " AND to_char(date, 'YYYY-MM') = $2";
      params.push(month);
    }

    query += " ORDER BY date DESC, id DESC";

    const result = await pool.query(query, params);

    const formattedRows = result.rows.map(row => {
      let d = row.date;
      if (d instanceof Date) {
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        d = `${year}-${month}-${day}`;
      }
      return { ...row, date: d };
    });

    res.json(formattedRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

app.get("/summary", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { month } = req.query;

    let incomeQuery = "SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id=$1 AND type='income'";
    let expenseQuery = "SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id=$1 AND type='expense'";
    let params = [userId];

    if (month) {
      incomeQuery += " AND to_char(date, 'YYYY-MM') = $2";
      expenseQuery += " AND to_char(date, 'YYYY-MM') = $2";
      params.push(month);
    }

    const income = await pool.query(incomeQuery, params);
    const expense = await pool.query(expenseQuery, params);

    const totalIncome = parseInt(income.rows[0].total);
    const totalExpense = parseInt(expense.rows[0].total);

    res.json({
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

app.get("/savings", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const result = await pool.query("SELECT * FROM savings_plans WHERE user_id=$1 ORDER BY target_date ASC", [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch savings" });
  }
});

app.post("/savings", authMiddleware, async (req, res) => {
  try {
    const { name, target_amount, target_date } = req.body;
    const userId = req.user.user_id;
    const result = await pool.query(
      "INSERT INTO savings_plans (user_id, name, target_amount, target_date) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, name, target_amount, target_date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create savings plan" });
  }
});

app.put("/savings/:id/add", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const planId = req.params.id;
    const userId = req.user.user_id;

    const plan = await pool.query("SELECT * FROM savings_plans WHERE id=$1 AND user_id=$2", [planId, userId]);
    if (plan.rows.length === 0) return res.status(404).json({ error: "Plan not found" });

    const result = await pool.query(
      "UPDATE savings_plans SET current_amount = current_amount + $1 WHERE id=$2 RETURNING *",
      [amount, planId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update savings" });
  }
});

app.delete("/savings/:id", authMiddleware, async (req, res) => {
  try {
    const planId = req.params.id;
    const userId = req.user.user_id;
    await pool.query("DELETE FROM savings_plans WHERE id=$1 AND user_id=$2", [planId, userId]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

app.get("/bills", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const result = await pool.query("SELECT * FROM bills WHERE user_id=$1 ORDER BY due_date ASC", [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bills" });
  }
});

app.post("/bills", authMiddleware, async (req, res) => {
  try {
    const { name, amount, due_date } = req.body;
    const userId = req.user.user_id;
    const result = await pool.query(
      "INSERT INTO bills (user_id, name, amount, due_date) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, name, amount, due_date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create bill" });
  }
});

app.put("/bills/:id/pay", authMiddleware, async (req, res) => {
  try {
    const { is_paid } = req.body;
    const billId = req.params.id;
    const userId = req.user.user_id;

    const result = await pool.query(
      "UPDATE bills SET is_paid=$1 WHERE id=$2 AND user_id=$3 RETURNING *",
      [is_paid, billId, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Bill not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update bill" });
  }
});

app.get("/download-data", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const response = await axios.get(`http://exporter:5000/export?user_id=${userId}`, {
      responseType: 'arraybuffer'
    });

    res.setHeader('Content-Disposition', 'attachment; filename=finance_data.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.send(response.data);
  } catch (err) {
    console.error("EXPORT ERROR:", err.message);
    if (err.response) {
      console.error("Exporter Response:", err.response.status, err.response.data);
      return res.status(err.response.status).json({ error: `Exporter failed: ${err.message}` });
    }
    res.status(500).json({ error: `Export failed: ${err.message}` });
  }
});

app.get("/test-download", authMiddleware, (req, res) => {
  const fileContent = "This is a test file to verify Cloudflare/Nginx download capability.";
  res.setHeader('Content-Disposition', 'attachment; filename=test.txt');
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'no-store');
  res.send(fileContent);
});

app.delete("/bills/:id", authMiddleware, async (req, res) => {
  try {
    const billId = req.params.id;
    const userId = req.user.user_id;
    await pool.query("DELETE FROM bills WHERE id=$1 AND user_id=$2", [billId, userId]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend running on port", PORT));
