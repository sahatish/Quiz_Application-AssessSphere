# AssessSphere
# 🎓 AssessSphere — Full-Stack Java & React Assessment Portal

![Java](https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/spring%20boot-%236DB33F.svg?style=for-the-badge&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)

AssessSphere is a full-stack online examination and coding assessment platform.

## Tech Stack
- **Backend:** Java (Spring Boot) + PostgreSQL
- **Frontend:** React (Vite) + Vanilla CSS

## How to Run Locally

### 1. Database Setup
Make sure PostgreSQL is running on your machine:
- **Port:** `5432`
- **Database Name:** `exam_portal`
- **Username:** `postgres`
- **Password:** `---------`

### 2. Run Backend
```bash
cd quiz-backend
./mvnw spring-boot:run
```
*(Runs on http://localhost:8080)*

### 3. Run Frontend
```bash
cd quiz-frontend
npm install
npm run dev
```
*(Runs on http://localhost:5173)*
