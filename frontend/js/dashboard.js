const API_URL = "http://localhost:3000/expenses";

const token = localStorage.getItem("token");
const expenseTable = document.getElementById("expenseTable");
const logoutBtn = document.getElementById("logoutBtn");
const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("statusFilter");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const modal = document.getElementById("expenseModal");
const addExpenseBtn = document.getElementById("addExpenseBtn");
const closeModal = document.getElementById("closeModal");
const loading = document.getElementById("loading");

const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const commentInput = document.getElementById("comment");
const statusInput = document.getElementById("status");

const saveBtn = document.getElementById("saveBtn");

const departmentInput = document.getElementById("department");

const departmentFilter = document.getElementById("departmentFilter");

let department = "";

let editingId = null;

let currentPage = 1;
let search = "";
let status = "";

let expenses = [];

if (!token) {
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  loadExpenses();
});

async function loadExpenses() {
  try {
    loading.style.display = "block";
    const response = await fetch(
      `${API_URL}?page=${currentPage}&search=${search}&status=${status}&department=${department}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const data = await response.json();
    expenses = data.expenses;
    document.getElementById("pendingAmount").textContent =
      `Total Pending Amount : ₹${data.totalPendingAmount}`;
    displayExpenses(expenses);
    renderPagination(data.totalPages);

    prevBtn.disabled = currentPage === 1;

    nextBtn.disabled = currentPage === data.totalPages;
  } catch (error) {
    console.error(error);
    alert("Failed to load expenses.");
  } finally {
    loading.style.display = "none";
  }
}

function displayExpenses(expenses) {
  expenseTable.innerHTML = "";
  if (expenses.length === 0) {
    expenseTable.innerHTML = `<tr>
      <td colspan="7">No expenses found.</td>
    </tr>`;
    return;
  }
  expenses.forEach((expense) => {
    expenseTable.innerHTML += `
      <tr>
        <td>${expense.id}</td>
        <td>${expense.title}</td>
        <td>${expense.amount}</td>
        <td>${expense.comment}</td>
        <td>${expense.status}</td>
        <td>${expense.department}</td>
        <td>
            <button onclick="editExpense(${expense.id})">
                Edit
            </button>
            <button onclick="deleteExpense(${expense.id})">
                Delete
            </button>
        </td>
      </tr>
    `;
  });
}

function renderPagination(totalPages) {
  const pageNumbers = document.getElementById("pageNumbers");
  pageNumbers.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.classList.add("page-btn");
    if (i === currentPage) {
      button.classList.add("active-page");
    }
    button.addEventListener("click", () => {
      currentPage = i;
      loadExpenses();
    });
    pageNumbers.appendChild(button);
  }
}

function editExpense(id) {
  const expense = expenses.find((expense) => expense.id === id);
  if (!expense) {
    return;
  }
  editingId = id;
  document.getElementById("modalTitle").textContent = "Edit Expense";
  saveBtn.textContent = "Update Expense";

  titleInput.value = expense.title;
  amountInput.value = expense.amount;
  commentInput.value = expense.comment;
  statusInput.value = expense.status;
  departmentInput.value = expense.department;

  modal.style.display = "block";
  if (expense.status === "Approved") {
    titleInput.disabled = true;
    amountInput.disabled = true;
    statusInput.disabled = true;
    departmentInput.disabled = true;

    commentInput.disabled = false;
  } else {
    titleInput.disabled = false;
    amountInput.disabled = false;
    statusInput.disabled = false;
    departmentInput.disabled = false;

    commentInput.disabled = false;
  }
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

let searchDebounceTimer = null;

searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    search = searchInput.value.trim();
    currentPage = 1;
    loadExpenses();
  }, 300);
});

statusFilter.addEventListener("change", () => {
  status = statusFilter.value;
  currentPage = 1;
  loadExpenses();
});

departmentFilter.addEventListener("change", () => {
  department = departmentFilter.value;

  currentPage = 1;

  loadExpenses();
});

prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    loadExpenses();
  }
});

nextBtn.addEventListener("click", () => {
  currentPage++;
  loadExpenses();
});

saveBtn.addEventListener("click", () => {
  if (editingId) {
    updateExpense();
  } else {
    addExpense();
  }
});

addExpenseBtn.addEventListener("click", () => {
  editingId = null;
  clearForm();
  document.getElementById("modalTitle").textContent = "Add Expense";
  saveBtn.textContent = "Save";
  modal.style.display = "block";
});

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

async function addExpense() {
  const expense = {
    title: titleInput.value.trim(),
    amount: Number(amountInput.value),
    comment: commentInput.value.trim(),
    status: statusInput.value,
    department: departmentInput.value,
  };

  if (!expense.title) {
    alert("Title is required");
    return;
  }

  if (expense.amount <= 0) {
    alert("Amount must be greater than 0");
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(expense),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    clearForm();
    modal.style.display = "none";
    loadExpenses();
  } catch (error) {
    console.error(error);

    alert("Something went wrong.");
  }
}

function clearForm() {
  editingId = null;
  titleInput.value = "";
  amountInput.value = "";
  commentInput.value = "";
  statusInput.value = "Pending";
  department.value = "";
  titleInput.disabled = false;
  amountInput.disabled = false;
  statusInput.disabled = false;
  commentInput.disabled = false;
  departmentInput.disabled = false;
  saveBtn.textContent = "Save";
}

async function updateExpense() {
  const updatedExpense = {
    title: titleInput.value.trim(),
    amount: Number(amountInput.value),
    comment: commentInput.value.trim(),
    status: statusInput.value,
    department: departmentInput.value,
  };

  if (!updatedExpense.title) {
    alert("Title is required.");
    return;
  }

  if (updatedExpense.amount <= 0) {
    alert("Amount must be greater than 0.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${editingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedExpense),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    clearForm();

    modal.style.display = "none";

    loadExpenses();
  } catch (error) {
    console.error(error);
    alert("Something went wrong.");
  }
}

async function deleteExpense(id) {
  const isConfirmed = confirm("Are you sure you want to delete this expense?");
  if (!isConfirmed) {
    return;
  }
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.message);
      return;
    }
    alert(data.message);
    loadExpenses();
  } catch (error) {
    console.error(error);
    alert("Something went wrong.");
  }
}
