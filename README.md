# 🎓 AssessSphere – Full-Stack Online Assessment & Examination Platform

AssessSphere is a full-stack online assessment platform built using **Java Spring Boot, React.js, and PostgreSQL**. It provides an interactive environment for conducting online examinations, managing assessments, and evaluating candidate performance through a centralized platform.

## 🚀 Key Features

* **Online Assessments:** Provides an interactive platform for candidates to participate in online examinations and quizzes.
* **Quiz Management:** Supports assessment creation and management.
* **Coding Assessments:** Provides a platform for technical and programming-based evaluations.
* **User Interface:** Responsive and user-friendly React-based frontend.
* **Backend REST APIs:** Spring Boot-powered backend for handling application logic and data processing.
* **Database Management:** PostgreSQL integration for persistent data storage.

## 🛠️ Technology Stack

| Category         | Technologies      |
| ---------------- | ----------------- |
| Backend          | Java, Spring Boot |
| Frontend         | React.js, Vite    |
| Database         | PostgreSQL        |
| Styling          | Vanilla CSS       |
| API Architecture | REST APIs         |
| Build Tool       | Maven             |
| Package Manager  | npm               |

## 📂 Project Structure

```text
AssessSphere/
│
├── quiz-backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   └── resources/
│   │   └── test/
│   ├── pom.xml
│   └── mvnw
│
├── quiz-frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## ⚙️ Installation & Setup

Follow these steps to run AssessSphere locally.

### Prerequisites

Make sure you have installed:

* Java JDK 17 or later
* Node.js and npm
* PostgreSQL
* Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd AssessSphere
```

### 2. Database Configuration

Make sure PostgreSQL is running on your local machine.

Create a database named:

```sql
CREATE DATABASE exam_portal;
```

Configure your database credentials in the backend application configuration.

**Database Configuration:**

| Configuration | Value                    |
| ------------- | ------------------------ |
| Database      | exam_portal              |
| Host          | localhost                |
| Port          | 5432                     |
| Username      | postgres                 |
| Password      | Your PostgreSQL password |

### 3. Start the Backend

Navigate to the backend directory:

```bash
cd quiz-backend
```

Run the Spring Boot application:

**Windows:**

```bash
mvnw.cmd spring-boot:run
```

**Linux / macOS:**

```bash
./mvnw spring-boot:run
```

Backend server:

`http://localhost:8080`

### 4. Start the Frontend

Open a new terminal and navigate to the frontend directory:

```bash
cd quiz-frontend
```

Install dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

Frontend application:

`http://localhost:5173`

## 🔗 Application URLs

| Component  | URL                   |
| ---------- | --------------------- |
| Frontend   | http://localhost:5173 |
| Backend    | http://localhost:8080 |
| PostgreSQL | localhost:5432        |

## 🔒 Security & Configuration

* Keep database credentials in local configuration files or environment variables.
* Never commit passwords, API keys, or other sensitive credentials to GitHub.
* Use appropriate authentication and authorization mechanisms.

## 👨‍💻 Developer

**Atish Kumar Sah**

* GitHub: [@sahatish](https://github.com/sahatish)

## 📄 License

This project is developed for educational and software development purposes.
