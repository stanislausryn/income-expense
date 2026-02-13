# 💰 Personal Finance Tracker

A modern, responsive, and containerized web application for tracking income, expenses, savings goals, and bills. Built with a focus on performance, security, and mobile usability.

## 🚀 Features

-   **Dashboard Overview**: Real-time summary of current balance, income, and expenses with visual charts.
-   **Transaction Management**: Add, view, and filter income and expense transactions.
-   **Mobile-First Design**: Fully responsive UI with a collapsible sidebar and touch-friendly controls.
-   **Savings Plans**: Create and track progress towards financial goals.
-   **Bill Reminders**: Track upcoming bills and due dates.
-   **Data Export**: Download all financial data as an Excel (`.xlsx`) file.
-   **Secure Authentication**: User registration and login with JWT-based sessions.
-   **Dark Mode**: Built-in dark theme support.
-   **Cloud-Ready**: Dockerized architecture with Nginx reverse proxy, ready for deployment (e.g., via Cloudflare Tunnel).

## 🛠️ Tech Stack

### Frontend
-   **HTML5 / CSS3**: Vanilla implementation for maximum performance and control.
-   **JavaScript (ES6+)**: specialized modules for API handling, layout, and charts.
-   **Chart.js**: Interactive data visualization.

### Backend
-   **Node.js & Express**: Robust REST API handling core logic.
-   **PostgreSQL**: Relational database for structured financial data.
-   **JWT**: Secure, stateless authentication.

### Microservices
-   **Exporter Service**: Python (Flask + Pandas) service dedicated to generating Excel reports.

### DevOps & Infrastructure
-   **Docker & Docker Compose**: Full container orchestration.
-   **Nginx**: Reverse proxy for serving static files and routing API requests.
-   **GitHub Actions**: CI/CD pipeline for automated testing and deployment.

## 📋 Prerequisites

-   [Docker Desktop](https://www.docker.com/products/docker-desktop) installed.
-   [Git](https://git-scm.com/) installed.

## ⚡ Quick Start (Local Development)

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/income-expense-app.git
    cd income-expense-app
    ```

2.  **Start the Application**
    ```bash
    docker-compose up --build -d
    ```

3.  **Access the App**
    Open your browser and navigate to: [http://localhost:1292](http://localhost:1292)

4.  **Default User** (Optional)
    You can register a new account on the login page.

## 🚀 Deployment (Production)

The application is configured for production deployment using `docker-compose.prod.yml`.

1.  **Set Environment Variables**
    Ensure your server has the required environment variables (Database credentials, JWT secret, etc.) set in a `.env` file or CI/CD secrets.

2.  **Deploy Command**
    ```bash
    docker-compose -f docker-compose.prod.yml up --build -d
    ```

3.  **Cloudflare Tunnel (Optional)**
    If using Cloudflare Tunnel, point your service to `http://<server-ip>:1292`.

## 📂 Project Structure

```
.
├── backend/            # Node.js API Server
├── frontend/           # Static HTML/CSS/JS Assets + Nginx Config
├── exporter/           # Python Microservice for Excel Export
├── db/                 # Database Initialization Scripts
├── docker-compose.yml  # Local Development Config
└── docker-compose.prod.yml # Production Configuration
```

## 📸 Screenshots

*(Add your screenshots here)*

---
*Built for the "Freepass 2026" Competition.*
