if (!localStorage.getItem("token")) {
    window.location.href = "login.html";
}

document.getElementById("resetDataBtn").addEventListener("click", async () => {
    if (!confirm("DANGER: This will permanently delete ALL your data (Transactions, Savings, Bills). Are you sure?")) {
        return;
    }

    if (!confirm("Final Confirmation: Really delete everything? This cannot be undone.")) {
        return;
    }

    try {
        const res = await apiFetch("/reset", { method: "POST" });
        if (res.ok) {
            alert("All data has been reset.");
            window.location.reload();
        } else {
            const data = await res.json();
            alert("Failed to reset data: " + (data.error || "Unknown error"));
        }
    } catch (error) {
        console.error("Reset error:", error);
        alert("An error occurred while resetting data.");
    }
});

document.getElementById("exportBtn").addEventListener("click", async () => {
    try {
        const token = getToken();
        const res = await fetch(`${API_URL}/download-data`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "finance_data.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            const errText = await res.text();
            alert(`Export failed: ${res.status} ${errText}`);
        }
    } catch (error) {
        console.error("Export error:", error);
        alert(`Error exporting data: ${error.message}`);
    }
});



document.getElementById("logoutBtn").addEventListener("click", () => {
    clearToken();
    window.location.href = "login.html";
});
