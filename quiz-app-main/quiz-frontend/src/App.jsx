import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Profile from './pages/Profile'

// Student
import ExamEntry from './pages/student/ExamEntry'
import UnifiedAssessment from './pages/student/UnifiedAssessment'
import Result from './pages/student/Result'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import ManageQuizzes from './pages/admin/ManageQuizzes'
import ManageQuestions from './pages/admin/ManageQuestions'
import Students from './pages/admin/Students'
import AdminStudentDetail from './pages/admin/StudentDetail'
import AdminResults from './pages/admin/Results'
import AdminCodingTests from './pages/admin/CodingTests'
import CodingTestDetail from './pages/admin/CodingTestDetail'
import AdminQuizDetail from './pages/admin/QuizDetail'
import QuizShareRedirect from './pages/QuizShareRedirect'
import ManageAssessments from './pages/admin/ManageAssessments'
import AssessmentDetail from './pages/admin/AssessmentDetail'

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAdmin } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (requireAdmin && !isAdmin) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Shareable quiz link — public, no auth required here (handled inside component) */}
      <Route path="/quiz/:id" element={<QuizShareRedirect />} />

      {/* Profile — all logged-in users */}
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      {/* Student Private Link Entry */}
      <Route path="/exam/entry/:token" element={<ExamEntry />} />

      {/* Student (Token Secured) */}
      <Route path="/assessment/:id" element={<UnifiedAssessment />} />
      <Route path="/student/quizzes/:id/attempt" element={<UnifiedAssessment />} />
      <Route path="/student/coding/:id" element={<UnifiedAssessment />} />
      <Route path="/student/success" element={<Result />} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/assessments" element={<ProtectedRoute requireAdmin><ManageAssessments /></ProtectedRoute>} />
      <Route path="/admin/quizzes" element={<ProtectedRoute requireAdmin><ManageQuizzes /></ProtectedRoute>} />
      <Route path="/admin/quizzes/:id" element={<ProtectedRoute requireAdmin><AdminQuizDetail /></ProtectedRoute>} />
      <Route path="/admin/quizzes/:id/questions" element={<ProtectedRoute requireAdmin><ManageQuestions /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute requireAdmin><Students /></ProtectedRoute>} />
      <Route path="/admin/students/:id" element={<ProtectedRoute requireAdmin><AdminStudentDetail /></ProtectedRoute>} />
      <Route path="/admin/results" element={<ProtectedRoute requireAdmin><AdminResults /></ProtectedRoute>} />
      <Route path="/admin/coding" element={<ProtectedRoute requireAdmin><AdminCodingTests /></ProtectedRoute>} />
      <Route path="/admin/coding/:id" element={<ProtectedRoute requireAdmin><CodingTestDetail /></ProtectedRoute>} />
      <Route path="/admin/assessments/:id" element={<ProtectedRoute requireAdmin><AssessmentDetail /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1c2b3c',
              color: '#d4e4fa',
              border: '1px solid rgba(37,99,235,0.3)',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#4cd7f6', secondary: '#051424' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#051424' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
