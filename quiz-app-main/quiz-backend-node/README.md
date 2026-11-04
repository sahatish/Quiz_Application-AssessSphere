# AssessSphere — MERN Backend (Node.js/Express/MongoDB)

This is the **MERN** replacement for the original Spring Boot + PostgreSQL backend.

## Stack
| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | Email-as-Bearer-token (same as original) |
| Email | Nodemailer (Gmail SMTP) |
| Code Execution | Judge0 API or local via child_process |

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
copy .env.example .env
```
Edit `.env` with your values:
- `MONGO_URI` — MongoDB connection string (local or Atlas)
- `MAIL_USER` / `MAIL_PASS` — Gmail credentials for OTP emails
- `JUDGE0_ENABLED=true` — (optional) enable Judge0 code execution

### 3. Start development server
```bash
npm run dev
```

The API runs on `http://localhost:8080` by default.

## API Endpoints (preserved 1:1 from Spring Boot)

### Auth
- `POST /api/register`
- `POST /api/login`
- `POST /api/forgot-password/request`
- `POST /api/forgot-password/reset`

### Admin
- `GET  /api/admin/stats`
- `GET/POST/PUT/DELETE /api/admin/quizzes`
- `GET/POST/PUT/DELETE /api/admin/questions`
- `GET/POST/PUT/DELETE /api/admin/coding-tests`
- `GET/POST/PUT/DELETE /api/admin/assessments`
- `GET/DELETE /api/admin/students`
- `GET /api/admin/results`
- `POST /api/admin/tokens/generate`
- `GET /api/admin/tokens/exam/:type/:id`

### Student
- `GET /api/student/quizzes`
- `POST /api/student/quizzes/start/:quizId`
- `POST /api/student/quizzes/submit-answer`
- `POST /api/student/quizzes/submit/:attemptId`
- `GET /api/student/coding-tests`
- `POST /api/student/code/run`
- `POST /api/student/code/submit`
- `GET /api/student/results/:attemptId`

### Assessment (Public)
- `GET  /api/assessment/:token`
- `POST /api/assessment/enroll`
- `POST /api/assessment/start`
- `POST /api/assessment/submit`
- `POST /api/assessment/submit-coding`

### Tokens
- `GET  /api/tokens/verify?token=`
- `POST /api/tokens/consume?token=`

## Frontend
The React/Vite frontend in `../quiz-frontend` works **without any changes**.
The axios base URL is already `/api` and the same auth mechanism (Bearer email) is preserved.
