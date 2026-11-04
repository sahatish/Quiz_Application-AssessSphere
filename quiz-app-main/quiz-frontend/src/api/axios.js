import axios from 'axios'



  const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})


// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('assesssphere_user') || 'null')
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`
  }
  return config
})

// Response interceptor — unwrap data
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('assesssphere_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  forgotPasswordRequest: (data) => api.post('/forgot-password/request', data),
  forgotPasswordReset: (data) => api.post('/forgot-password/reset', data),
}

// ─── Student Quiz ──────────────────────────────────────────────
export const studentQuizApi = {
  getAll: () => api.get('/student/quizzes'),
  getById: (id) => api.get(`/student/quizzes/${id}`),
  getAssessment: (id) => api.get(`/student/quizzes/${id}/assessment`),
}

// ─── Quiz Attempt ──────────────────────────────────────────────
export const attemptApi = {
  start: (quizId, studentId) =>
    api.post(`/student/quizzes/start/${quizId}?studentId=${studentId}`),
  submitAnswer: (data) => api.post('/student/quizzes/submit-answer', data),
  submitCoding: (data) => api.post('/student/quizzes/submit-coding', data),
  submit: (attemptId) => api.post(`/student/quizzes/submit/${attemptId}`),
}

// ─── Results ───────────────────────────────────────────────────
export const resultApi = {
  get: (attemptId) => api.get(`/student/results/${attemptId}`),
}

// ─── Questions ─────────────────────────────────────────────────
export const questionApi = {
  getForStudent: (quizId) => api.get(`/questions/quiz/${quizId}`),
  getForAdmin: (quizId) => api.get(`/admin/questions/quiz/${quizId}`),
  add: (data) => api.post('/admin/questions', data),
  bulkAdd: (quizId, data) => api.post('/admin/questions/bulk', data),
  update: (id, data) => api.put(`/admin/questions/${id}`, data),
  delete: (id) => api.delete(`/admin/questions/${id}`),
}

// ─── Admin Quiz ────────────────────────────────────────────────
export const adminQuizApi = {
  getAll: () => api.get('/admin/quizzes'),
  getById: (id) => api.get(`/admin/quizzes/${id}`),
  create: (data) => api.post('/admin/quizzes', data),
  update: (id, data) => api.put(`/admin/quizzes/${id}`, data),
  delete: (id) => api.delete(`/admin/quizzes/${id}`),
}

// ─── Admin General ─────────────────────────────────────────────
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getStudents: (page = 0, size = 10, search = '') => api.get(`/admin/students?page=${page}&size=${size}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),
  getStudentResults: (id) => api.get(`/admin/students/${id}/results`),
  getResults: (page = 0, size = 10) => api.get(`/admin/results?page=${page}&size=${size}`),
  getQuizResults: (quizId) => api.get(`/admin/quizzes/${quizId}/results`),
}

// ─── Coding Tests ──────────────────────────────────────────────
export const codingApi = {
  getAll: () => api.get('/student/coding-tests'),
  getById: (id) => api.get(`/student/coding-tests/${id}`),
  adminGetById: (id) => api.get(`/admin/coding-tests/${id}`),
  run: (data) => api.post('/student/code/run', data),
  submit: (data) => api.post('/student/code/submit', data),
  create: (data) => api.post('/admin/coding-tests', data),
  update: (id, data) => api.put(`/admin/coding-tests/${id}`, data),
  delete: (id) => api.delete(`/admin/coding-tests/${id}`),
  importLeetCode: (query) => api.get(`/admin/coding-tests/import-leetcode?query=${encodeURIComponent(query)}`),
}

// ─── Exam Tokens ───────────────────────────────────────────────
// FIX: removed duplicate /api prefix — baseURL is already /api
export const examTokenApi = {
  generate: (data) => api.post('/admin/tokens/generate', data),
  getForExam: (type, id, page = 0, size = 20) => api.get(`/admin/tokens/exam/${type}/${id}?page=${page}&size=${size}`),
  verify: (token) => api.get(`/tokens/verify?token=${token}`),       // was /api/tokens/verify
  consume: (token) => api.post(`/tokens/consume?token=${token}`),    // was /api/tokens/consume
  emailAll: (type, id, baseUrl) =>
    api.post(`/admin/tokens/exam/${type}/${id}/email-all?baseUrl=${encodeURIComponent(baseUrl)}`),
}

// ─── Unified Assessments ───────────────────────────────────────
export const assessmentApi = {
  create: (data) => api.post('/admin/assessments', data),
  getAll: () => api.get('/admin/assessments'),
  getById: (id) => api.get(`/admin/assessments/${id}`),
  update: (id, data) => api.put(`/admin/assessments/${id}`, data),
  delete: (id) => api.delete(`/admin/assessments/${id}`),
  regenerateShareToken: (id) => api.post(`/admin/assessments/${id}/share`),
  getByToken: (token) => api.get(`/assessment/${token}`),
  startAttempt: (assessmentId, studentId) =>
    api.post(`/assessment/start?assessmentId=${assessmentId}&studentId=${studentId}`),
  submitAttempt: (attemptId, answers) =>
    api.post('/assessment/submit', { attemptId, answers }),
  // FIX: code now sent as JSON body — was query param (broke on long submissions)
  submitCoding: (assessmentAttemptId, codingTestId, code, language, passed) =>
    api.post('/assessment/submit-coding', { assessmentAttemptId, codingTestId, code, language, passed }),
  enroll: (name, email, phone) =>
    api.post(`/assessment/enroll?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone || '')}`),
}

export default api
