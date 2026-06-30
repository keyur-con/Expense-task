const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;

const FilePath = path.join(__dirname, "data", "expenses.json");
const secretKey = "secret123";

app.use(cors());
app.use(express.json());

async function readExpenses() {
  try {
    const data = await fs.readFile(FilePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading expenses:", error);
    return [];
  }
}

async function writeExpenses(expenses) {
  try {
    await fs.writeFile(FilePath, JSON.stringify(expenses, null, 2));
  } catch (error) {
    console.error("Error writing expenses:", error);
  }
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      message: "Access denied. Token missing.",
    });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
}

app.get("/", (req, res) => {
  res.send("Expense Tracker API is running");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password are required",
    });
  }
  if (username !== "admin" || password !== "1234") {
    return res.status(401).json({
      message: "Invalid username or password",
    });
  }
  const token = jwt.sign({ username: username }, secretKey, {
    expiresIn: "1h",
  });
  res.status(200).json({
    message: "Login successful",
    token: token,
  });
});

app.post("/expenses", verifyToken, async (req, res) => {
  try {
    const { title, amount, comment, status, department } = req.body;

    // if (!title || amount === undefined || !status) {
    //   return res.status(400).json({
    //     message: "Title, amount and status are required.",
    //   });
    // }
    if (!title) {
      return res.status(400).json({
        message: "Title is required.",
      });
    }
    if (amount === undefined) {
      return res.status(400).json({
        message: "Amount is required.",
      });
    }
    if (!status) {
      return res.status(400).json({
        message: "Status is required.",
      });
    }
    if (!department) {
      return res.status(400).json({
        message: "Department is required.",
      });
    }
    const validDepartments = ["IT", "HR", "Finance", "Marketing"];

    if (!validDepartments.includes(department)) {
      return res.status(400).json({
        message: "Invalid department.",
      });
    }
    if (isNaN(amount)) {
      return res.status(400).json({
        message: "Amount invalid.",
      });
    }
    if (amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0.",
      });
    }
    
    if (
      status !== "Pending" &&
      status !== "Approved" &&
      status !== "Rejected"
    ) {
      return res.status(400).json({
        message: "Invalid status.",
      });
    }
    const expenses = await readExpenses();
    const newId =
      expenses.length > 0
        ? Math.max(...expenses.map((expense) => expense.id)) + 1
        : 1;
    const newExpense = {
      id: newId,
      title,
      amount,
      comment: comment || "",
      status: status || "Pending",
      department,
    };
    expenses.push(newExpense);
    await writeExpenses(expenses);
    res.status(201).json({
      message: "Expense added successfully.",
      expense: newExpense,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

app.get("/expenses", verifyToken, async (req, res) => {
  try {
    const { search, status, department, page = 1, limit = 10 } = req.query;
    let expenses = await readExpenses();
    if (search) {
      expenses = expenses.filter(
        (expense) =>
          expense.title.toLowerCase().includes(search.toLowerCase()) ||
          expense.amount.toString().includes(search.trim()),
      );
    }
    if (status) {
      expenses = expenses.filter((expense) => expense.status === status);
    }
    if (department) {
      expenses = expenses.filter(
        (expense) => expense.department === department,
      );
    }
    const totalPendingAmount = expenses
      .filter((expense) => expense.status === "Pending")
      .reduce((total, expense) => total + expense.amount, 0);
    const currentPage = Number(page);
    const limitPerPage = Number(limit);
    if (
      currentPage < 1 ||
      limitPerPage < 1 ||
      isNaN(currentPage) ||
      isNaN(limitPerPage)
    ) {
      return res.status(400).json({
        message: "Invalid page or limit.",
      });
    }
    const startIndex = (currentPage - 1) * limitPerPage;
    const endIndex = startIndex + limitPerPage;
    const paginatedExpenses = expenses.slice(startIndex, endIndex);
    res.status(200).json({
      totalExpenses: expenses.length,
      totalPendingAmount,
      currentPage,
      totalPages: Math.ceil(expenses.length / limitPerPage),
      expenses: paginatedExpenses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

app.patch("/expenses/:id", verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, amount, comment, status, department } = req.body || {};
    const expenses = await readExpenses();
    const expense = expenses.find((expense) => expense.id === id);
    if (!expense) {
      return res.status(404).json({
        message: "Expense not found.",
      });
    }
    if (expense.status === "Approved") {
      if (comment === undefined) {
        return res.status(400).json({
          message: "Approved expenses can only update comments.",
        });
      }
      expense.comment = comment;
      await writeExpenses(expenses);
      return res.status(200).json({
        message: "Comment updated successfully.",
        expense,
      });
    }
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0.",
      });
    }
    if (
      status !== undefined &&
      status !== "Pending" &&
      status !== "Approved" &&
      status !== "Rejected"
    ) {
      return res.status(400).json({
        message: "Invalid status.",
      });
    }
    if (title !== undefined && title.trim() !== "") {
      expense.title = title;
    }
    if (amount !== undefined) {
      expense.amount = amount;
    }
    if (comment !== undefined) {
      expense.comment = comment;
    }
    if (status !== undefined) {
      expense.status = status;
    }
    if (
      department !== undefined &&
      !["IT", "HR", "Finance", "Marketing"].includes(department)
    ) {
      return res.status(400).json({
        message: "Invalid department.",
      });
    }
    if (department !== undefined) {
      expense.department = department;
    }
    await writeExpenses(expenses);
    res.status(200).json({
      message: "Expense updated successfully.",
      expense,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

app.delete("/expenses/:id", verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const expenses = await readExpenses();
    const expense = expenses.find((expense) => expense.id === id);
    if (!expense) {
      return res.status(404).json({
        message: "Expense not found.",
      });
    }
    const updatedExpenses = expenses.filter((expense) => expense.id !== id);
    await writeExpenses(updatedExpenses);
    res.status(200).json({
      message: "Expense deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
