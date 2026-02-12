// Reuse shared redirect
if (!localStorage.getItem("token")) {
    window.location.href = "login.html";
}

document.getElementById("resetDataBtn").addEventListener("click", async () => {
    if (!confirm("DANGER: This will permanently delete ALL your data (Transactions, Savings, Bills). Are you sure?")) {
        return;
    }

    // Double confirmation
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

document.getElementById("logoutBtn").addEventListener("click", () => {
    clearToken();
    window.location.href = "login.html";
});
