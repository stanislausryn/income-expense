let selectedMonth = "";
let selectedDate = "";
let startDate = "";
let endDate = "";
let expenseChart = null;
let incomeChart = null;

const incomeCategories = ["Salary", "Allowance", "Investment", "Other"];
const expenseCategories = ["Food", "Entertainment", "Shopping", "Transport", "Utilities", "Other"];

function redirectIfNotLoggedIn() {
  if (!getToken()) {
    window.location.href = "login.html";
  }
}

function updateCategoryOptions() {
  const type = document.querySelector('input[name="type"]:checked').value;
  const categorySelect = document.getElementById("category");

  categorySelect.innerHTML = "";

  const list = type === "income" ? incomeCategories : expenseCategories;

  list.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    categorySelect.appendChild(opt);
  });
}

function updateCharts(transactions) {
  const textColor = getComputedStyle(document.body).getPropertyValue('--text-primary').trim();
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

  const expenses = transactions.filter(t => t.type === 'expense');
  const expenseTotals = {};
  expenses.forEach(t => {
    if (!expenseTotals[t.category]) expenseTotals[t.category] = 0;
    expenseTotals[t.category] += parseInt(t.amount);
  });
  const expenseLabels = Object.keys(expenseTotals);
  const expenseData = Object.values(expenseTotals);
  const totalExpense = expenseData.reduce((a, b) => a + b, 0);

  if (expenseChart) expenseChart.destroy();
  const ctxExpense = document.getElementById("expenseChart").getContext("2d");

  expenseChart = new Chart(ctxExpense, {
    type: 'doughnut',
    data: {
      labels: expenseLabels,
      datasets: [{
        data: expenseData,
        backgroundColor: colors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Expenses', color: textColor },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.raw;
              const percentage = totalExpense > 0 ? Math.round((value / totalExpense) * 100) : 0;
              return `${context.label}: ${percentage}%`;
            }
          }
        }
      },
      cutout: '65%',
    }
  });

  const incomes = transactions.filter(t => t.type === 'income');
  const incomeTotals = {};
  incomes.forEach(t => {
    if (!incomeTotals[t.category]) incomeTotals[t.category] = 0;
    incomeTotals[t.category] += parseInt(t.amount);
  });
  const incomeLabels = Object.keys(incomeTotals);
  const incomeData = Object.values(incomeTotals);
  const totalIncome = incomeData.reduce((a, b) => a + b, 0);

  if (incomeChart) incomeChart.destroy();
  const ctxIncome = document.getElementById("incomeChart").getContext("2d");

  incomeChart = new Chart(ctxIncome, {
    type: 'doughnut',
    data: {
      labels: incomeLabels,
      datasets: [{
        data: incomeData,
        backgroundColor: colors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Income', color: textColor },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.raw;
              const percentage = totalIncome > 0 ? Math.round((value / totalIncome) * 100) : 0;
              return `${context.label}: ${percentage}%`;
            }
          }
        }
      },
      cutout: '65%',
    }
  });
}

async function loadSummary() {
  let url = `/summary`;
  if (selectedMonth) url += `?month=${selectedMonth}`;

  const res = await apiFetch(url);
  if (!res.ok) return;

  const data = await res.json();

  document.getElementById("income").textContent = `Rp${parseInt(data.income).toLocaleString()}`;
  document.getElementById("expense").textContent = `Rp${parseInt(data.expense).toLocaleString()}`;
  document.getElementById("balance").textContent = `Rp${(parseInt(data.income) - parseInt(data.expense)).toLocaleString()}`;
}

async function loadTransactions() {
  let url = `/transactions`;
  if (selectedMonth) url += `?month=${selectedMonth}`;

  const res = await apiFetch(url);
  if (!res.ok) return;

  let apiData = await res.json();
  let filteredData = apiData;

  const statusEl = document.getElementById("activeFilterDisplay");
  statusEl.textContent = "";

  if (selectedDate) {
    filteredData = apiData.filter(t => t.date === selectedDate);
    statusEl.textContent = `Showing transactions for: ${selectedDate}`;
  } else if (startDate && endDate) {
    filteredData = apiData.filter(t => t.date >= startDate && t.date <= endDate);
    statusEl.textContent = `Showing transactions from ${startDate} to ${endDate}`;
  }

  const list = document.getElementById("transactionsList");
  list.innerHTML = "";

  if (filteredData.length === 0) {
    list.innerHTML = `<li class="tx-item" style="justify-content:center; color:var(--text-secondary)">No transactions found</li>`;
  }

  filteredData.forEach((t) => {
    const li = document.createElement("li");
    li.className = "tx-item";

    const isIncome = t.type === 'income';
    const amountClass = isIncome ? 'green' : 'red';
    const sign = isIncome ? '+' : '-';

    li.innerHTML = `
      <div class="tx-info">
        <h4>${t.category}</h4>
        <p>${formatDate(t.date, true)} • ${t.note || t.account || 'No notes'}</p>
      </div>
      <div class="tx-amount ${amountClass}">
        ${sign}Rp${parseInt(t.amount).toLocaleString()}
      </div>
    `;
    list.appendChild(li);
  });

  updateCharts(apiData);
}

async function refresh() {
  await loadSummary();
  await loadTransactions();
}

const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const clearFilterBtn = document.getElementById("clearFilters");

function handleRangeFilter() {
  startDate = startDateInput.value;
  endDate = endDateInput.value;

  if (startDate && endDate) {
    selectedDate = "";
    document.querySelectorAll(".calendar .day").forEach(d => d.classList.remove("active"));
    loadTransactions();
  }
}

startDateInput.addEventListener("change", handleRangeFilter);
endDateInput.addEventListener("change", handleRangeFilter);

clearFilterBtn.addEventListener("click", () => {
  startDate = "";
  endDate = "";
  startDateInput.value = "";
  endDateInput.value = "";
  selectedDate = "";
  document.querySelectorAll(".calendar .day").forEach(d => d.classList.remove("active"));
  loadTransactions();
});

function setupMonthYearDropdown() {
  const yearSelect = document.getElementById("yearSelect");
  const monthSelect = document.getElementById("monthSelect");
  const now = new Date();
  const currentYear = now.getFullYear();

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  monthSelect.innerHTML = "";
  yearSelect.innerHTML = "";

  months.forEach((m, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = m;
    monthSelect.appendChild(opt);
  });

  for (let y = currentYear - 5; y <= currentYear + 5; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }

  monthSelect.value = now.getMonth();
  yearSelect.value = currentYear;

  function updateCalendar() {
    const y = parseInt(yearSelect.value);
    const m = parseInt(monthSelect.value);
    selectedMonth = `${y}-${String(m + 1).padStart(2, "0")}`;

    selectedDate = "";
    startDate = "";
    endDate = "";
    startDateInput.value = "";
    endDateInput.value = "";

    generateCalendar(y, m, (dateStr) => {
      selectedDate = dateStr;
      startDate = "";
      endDate = "";
      startDateInput.value = "";
      endDateInput.value = "";
      loadTransactions();
    });
    refresh();
  }

  monthSelect.addEventListener("change", updateCalendar);
  yearSelect.addEventListener("change", updateCalendar);
  updateCalendar();
}

document.querySelectorAll('input[name="type"]').forEach(radio => {
  radio.addEventListener('change', updateCategoryOptions);
});

document.getElementById("txForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedDate && !startDate) {
    // Default to today if nothing selected
    const now = new Date();
    selectedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  const type = document.querySelector('input[name="type"]:checked').value;
  const amount = parseInt(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const account = document.getElementById("account").value;
  const note = document.getElementById("note").value;

  // Use selectedDate for the payload
  await apiFetch("/transactions", {
    method: "POST",
    body: JSON.stringify({ type, amount, category, note, date: selectedDate || startDate, account }),
  });

  e.target.reset();
  document.getElementById("type-income").checked = true;
  updateCategoryOptions();
  refresh();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearToken();
  window.location.href = "login.html";
});

function onCalendarDateSelect(dateStr) {
  selectedDate = dateStr;
  startDate = "";
  endDate = "";

  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";

  loadTransactions();
}

async function setupMonthYearDropdown() {
  const monthSelect = document.getElementById("monthSelect");
  const yearSelect = document.getElementById("yearSelect");
  const now = new Date();
  const currentYear = now.getFullYear();

  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.text = i;
    if (i === currentYear) option.selected = true;
    yearSelect.appendChild(option);
  }

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  months.forEach((m, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.text = m;
    monthSelect.appendChild(option);
  });

  // Set current month
  monthSelect.value = now.getMonth();

  function updateCalendar() {
    const y = parseInt(yearSelect.value);
    const m = parseInt(monthSelect.value);

    // FORMAT: YYYY-MM
    selectedMonth = `${y}-${String(m + 1).padStart(2, "0")}`;

    // Clear selections when month changes
    selectedDate = "";
    startDate = "";
    endDate = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";

    generateCalendar(y, m, onCalendarDateSelect, "calendar");

    // Load data for this month
    refresh();
  }

  monthSelect.addEventListener("change", updateCalendar);
  yearSelect.addEventListener("change", updateCalendar);

  // Initial load
  updateCalendar();
}

// Simplified date comparison since backend now guarantees YYYY-MM-DD string
function loadTransactions() {
  let url = `/transactions`;
  if (selectedMonth) url += `?month=${selectedMonth}`;

  // Use the cached function or define it
  const fetchAndRender = async () => {
    const res = await apiFetch(url);
    if (!res.ok) return;

    let apiData = await res.json();
    let filteredData = apiData;

    const statusEl = document.getElementById("activeFilterDisplay");
    statusEl.textContent = "";

    if (selectedDate) {
      // Strict string comparison
      filteredData = apiData.filter(t => t.date === selectedDate);
      statusEl.textContent = `Showing transactions for: ${selectedDate}`;
    } else if (startDate && endDate) {
      statusEl.textContent = `Showing transactions from ${startDate} to ${endDate}`;
      filteredData = apiData.filter(t => t.date >= startDate && t.date <= endDate);
    }

    const list = document.getElementById("transactionsList");
    list.innerHTML = "";

    if (filteredData.length === 0) {
      list.innerHTML = `<li class="tx-item" style="justify-content:center; color:var(--text-secondary)">No transactions found</li>`;
    }

    filteredData.forEach((t) => {
      const li = document.createElement("li");
      li.className = "tx-item";

      const isIncome = t.type === 'income';
      const amountClass = isIncome ? 'green' : 'red';
      const sign = isIncome ? '+' : '-';

      // formatDate with includeTime = false
      li.innerHTML = `
        <div class="tx-info">
          <h4>${t.category}</h4>
          <p>${formatDate(t.date, false)} • ${t.note || t.account || 'No notes'}</p>
        </div>
        <div class="tx-amount ${amountClass}">
          ${sign}Rp${parseInt(t.amount).toLocaleString()}
        </div>
      `;
      list.appendChild(li);
    });

    updateCharts(apiData); // Charts always use full month data
  };

  fetchAndRender();
}

redirectIfNotLoggedIn();
updateCategoryOptions();
document.addEventListener('DOMContentLoaded', () => {
  setupMonthYearDropdown();
});
