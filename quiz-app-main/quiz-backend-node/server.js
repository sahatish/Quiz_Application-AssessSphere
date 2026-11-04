require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// ── Connect to MongoDB ──────────────────────────────────────────
connectDB();

const app = express();

// ── Middleware ──────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Routes ──────────────────────────────────────────────────────
app.use('/api', require('./routes/auth'));
app.use('/api/admin', require('./routes/adminStats'));
app.use('/api/admin', require('./routes/adminQuiz'));
app.use('/api/admin', require('./routes/adminQuestions'));
app.use('/api/admin', require('./routes/adminStudents'));
app.use('/api/admin', require('./routes/adminResults'));
app.use('/api/admin', require('./routes/adminCoding'));
app.use('/api/admin', require('./routes/adminAssessments'));
app.use('/api/admin', require('./routes/adminTokens'));
app.use('/api/student', require('./routes/studentQuizzes'));
app.use('/api/student', require('./routes/studentCoding'));
app.use('/api/student', require('./routes/results'));
app.use('/api/assessment', require('./routes/assessmentPublic'));
app.use('/api/tokens', require('./routes/tokens'));
app.use('/api/questions', require('./routes/questions'));

// ── Global Error Handler ────────────────────────────────────────
app.use(require('./middleware/errorHandler'));

// ── Start Server ────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ AssessSphere API running on port ${PORT}`);
});
