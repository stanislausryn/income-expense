const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");

if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle("open");
        } else {
            sidebar.classList.toggle("collapsed");
        }
    });

    const closeSidebarBtn = document.getElementById("closeSidebar");
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener("click", () => {
            sidebar.classList.remove("open");
        });
    }

    document.addEventListener("click", (e) => {
        if (window.innerWidth <= 768 &&
            sidebar.classList.contains("open") &&
            !sidebar.contains(e.target) &&
            !sidebarToggle.contains(e.target)) {
            sidebar.classList.remove("open");
        }
    });
}

const darkModeToggle = document.getElementById("darkModeToggle");
const sunIcon = document.querySelector(".sun-icon");
const moonIcon = document.querySelector(".moon-icon");

function updateThemeUI(isDark) {
    if (isDark) {
        document.documentElement.classList.add("dark-mode");
        document.body.classList.add("dark-mode");
        document.body.classList.remove("light-mode");
        if (sunIcon) sunIcon.style.display = "none";
        if (moonIcon) moonIcon.style.display = "block";
    } else {
        document.documentElement.classList.remove("dark-mode");
        document.body.classList.remove("dark-mode");
        document.body.classList.add("light-mode");
        if (sunIcon) sunIcon.style.display = "block";
        if (moonIcon) moonIcon.style.display = "none";
    }
}

const savedTheme = localStorage.getItem("theme");
const isDark = savedTheme === "dark";
updateThemeUI(isDark);

if (darkModeToggle) {
    darkModeToggle.addEventListener("click", () => {
        const isCurrentDark = document.body.classList.contains("dark-mode");
        const newIsDark = !isCurrentDark;

        updateThemeUI(newIsDark);
        localStorage.setItem("theme", newIsDark ? "dark" : "light");

        if (typeof window.updateCharts === 'function' && window.transactionsCache) {
            if (typeof window.loadTransactions === 'function') window.loadTransactions();
        } else if (typeof window.loadTransactions === 'function') {
            window.loadTransactions();
        }
    });
}

function formatDate(dateString, includeTime = false) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }

    return date.toLocaleDateString('en-US', options);
}

if (!localStorage.getItem("token") && !window.location.href.includes("login.html")) {
    window.location.href = "login.html";
}
