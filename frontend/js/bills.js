async function loadBills() {
    const res = await apiFetch("/bills");
    if (!res.ok) return;
    const bills = await res.json();

    const list = document.getElementById("billsList");
    list.innerHTML = "";

    bills.forEach(bill => {
        const li = document.createElement("li");
        li.className = "tx-item";

        const isPaid = bill.is_paid;

        li.innerHTML = `
      <div class="tx-info">
        <h4>${bill.name} ${isPaid ? '✅' : '⚠️'}</h4>
        <p>Due: ${formatDate(bill.due_date)}</p>
      </div>
      
      <div style="display:flex; align-items:center; gap:10px;">
        <span class="tx-amount red">Rp${bill.amount.toLocaleString()}</span>
        ${!isPaid ?
                `<button onclick="togglePaid(${bill.id}, true)" class="btn-small">Mark Paid</button>` :
                `<button onclick="togglePaid(${bill.id}, false)" class="btn-small">Undo</button>`
            }
        <button onclick="deleteBill(${bill.id})" class="btn-small" style="color:red; border:none; padding:4px;">✖</button>
      </div>
    `;
        list.appendChild(li);
    });
}

async function togglePaid(id, status) {
    await apiFetch(`/bills/${id}/pay`, {
        method: "PUT",
        body: JSON.stringify({ is_paid: status })
    });
    loadBills();
}

async function deleteBill(id) {
    if (!confirm("Delete this bill?")) return;
    await apiFetch(`/bills/${id}`, { method: "DELETE" });
    loadBills();
}

document.getElementById("billsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("billName").value;
    const amount = document.getElementById("billAmount").value;
    const due_date = document.getElementById("billDate").value;

    if (!due_date) { alert("Please select a date"); return; }

    await apiFetch("/bills", {
        method: "POST",
        body: JSON.stringify({ name, amount: parseInt(amount), due_date })
    });

    e.target.reset();
    document.getElementById("billDatePickerBtn").textContent = "Select Date";
    loadBills();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    clearToken();
    window.location.href = "login.html";
});

setupCalendarPicker("billDatePickerBtn", "billDate");

loadBills();
