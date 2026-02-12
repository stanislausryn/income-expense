async function loadSavings() {
    const res = await apiFetch("/savings");
    if (!res.ok) return;
    const plans = await res.json();

    const list = document.getElementById("savingsList");
    list.innerHTML = "";

    list.style.display = "grid";
    list.style.gridTemplateColumns = "repeat(auto-fill, minmax(280px, 1fr))";
    list.style.gap = "20px";

    plans.forEach(plan => {
        const percent = Math.min(100, Math.round((plan.current_amount / plan.target_amount) * 100));

        const div = document.createElement("div");
        div.style.border = "1px solid var(--border-color)";
        div.style.padding = "16px";
        div.style.borderRadius = "12px";
        div.style.background = "var(--bg-color)";

        div.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <h4 style="font-size:16px;">${plan.name}</h4>
        <span style="font-size:12px; color:var(--text-secondary);">${formatDate(plan.target_date)}</span>
      </div>
      
      <div style="margin-bottom:12px;">
         <div style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:4px;">
            <span>Rp${plan.current_amount.toLocaleString()}</span>
            <span>of Rp${plan.target_amount.toLocaleString()}</span>
         </div>
         <div style="width:100%; background:#e5e7eb; height:8px; border-radius:4px; overflow:hidden;">
            <div style="width:${percent}%; background:var(--primary-color); height:100%;"></div>
         </div>
      </div>

      <div style="display:flex; gap:8px;">
        <button onclick="addMoney(${plan.id})" class="btn-small" style="flex:1;">+ Add Money</button>
        <button onclick="deletePlan(${plan.id})" class="btn-small" style="color:var(--danger-color); border-color:var(--danger-color);">Delete</button>
      </div>
    `;

        list.appendChild(div);
    });
}

async function addMoney(id) {
    const amount = prompt("Enter amount to add:");
    if (!amount) return;

    await apiFetch(`/savings/${id}/add`, {
        method: "PUT",
        body: JSON.stringify({ amount: parseInt(amount) })
    });
    loadSavings();
}

async function deletePlan(id) {
    if (!confirm("Are you sure?")) return;
    await apiFetch(`/savings/${id}`, { method: "DELETE" });
    loadSavings();
}

document.getElementById("savingsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("planName").value;
    const targetAmount = document.getElementById("targetAmount").value;
    const targetDate = document.getElementById("targetDate").value;

    if (!targetDate) { alert("Please select a date"); return; }

    await apiFetch("/savings", {
        method: "POST",
        body: JSON.stringify({ name, target_amount: targetAmount, target_date: targetDate })
    });

    e.target.reset();
    document.getElementById("datePickerBtn").textContent = "Select Date";
    loadSavings();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    clearToken();
    window.location.href = "login.html";
});

setupCalendarPicker("datePickerBtn", "targetDate");

loadSavings();
