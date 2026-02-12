const form = document.getElementById("loginForm");
const title = document.querySelector(".title");
const subtitle = document.querySelector(".subtitle");
const toggleBtn = document.getElementById("toggleBtn");
const toggleText = document.getElementById("toggleText");
const submitBtn = form.querySelector("button");

let isRegister = false;

toggleBtn.addEventListener("click", (e) => {
  e.preventDefault();
  isRegister = !isRegister;
  if (isRegister) {
    title.textContent = "Register";
    subtitle.textContent = "Create a new account";
    submitBtn.textContent = "Register";
    toggleText.textContent = "Already have an account?";
    toggleBtn.textContent = "Login";
  } else {
    title.textContent = "Finance Tracker";
    subtitle.textContent = "Please login to continue";
    submitBtn.textContent = "Login";
    toggleText.textContent = "Don't have an account?";
    toggleBtn.textContent = "Register";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("errorMsg");

  errorMsg.textContent = "";

  const endpoint = isRegister ? "/register" : "/login";

  try {
    const res = await apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      if (isRegister) {
        alert("Registration successful! Please login.");
        toggleBtn.click(); // Switch back to login
      } else {
        saveToken(data.token);
        window.location.href = "dashboard.html";
      }
    } else {
      errorMsg.textContent = data.error || (isRegister ? "Registration failed" : "Login failed");
    }
  } catch (err) {
    console.error(err);
    errorMsg.textContent = "An error occurred. Please try again.";
  }
});
