document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("errorMsg");

  errorMsg.textContent = "";

  try {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      saveToken(data.token);
      window.location.href = "dashboard.html";
    } else {
      errorMsg.textContent = data.error || "Login failed";
    }
  } catch (err) {
    console.error(err);
    errorMsg.textContent = "An error occurred. Please try again.";
  }
});
