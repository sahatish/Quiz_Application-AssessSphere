import React from 'react'
import './adminMock.css'

export default function AdminMock() {
  return (
    <div className="admin-mock card-lift">
      <div className="dashboard-frame">
        <div className="admin-header">
          <h3>Admin Dashboard</h3>
          <div className="admin-sub">Platform-wide analytics & overview</div>
        </div>
      
      {/* Floating cards */}
      {/* Questions Bank floating card removed per request */}

      <div className="floating-card floating-completion">
        <div className="float-ring">
          <svg viewBox="0 0 36 36" width="82" height="82" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gradRingFloat2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="var(--primary)" />
              </linearGradient>
            </defs>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#eef6ff" strokeWidth="3.6" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#gradRingFloat2)" strokeWidth="3.6" strokeLinecap="round" strokeDasharray="100" strokeDashoffset="18" transform="rotate(-90 18 18)" />
          </svg>
        </div>
        <div className="completion-value">82%</div>
        <div className="completion-sub">+15% this month</div>
      </div>

      {/* floating top-students removed to avoid duplication with main card */}

        <div className="admin-top-cards">
          <div className="admin-stat-card">
            <div className="stat-icon">📘</div>
            <div className="stat-body">
              <div className="stat-value">128</div>
              <div className="stat-label">Total Quizzes</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">👩‍💻</div>
            <div className="stat-body">
              <div className="stat-value">2,543</div>
              <div className="stat-label">Students</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">❓</div>
            <div className="stat-body">
              <div className="stat-value">220K+</div>
              <div className="stat-label">Questions</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">🔁</div>
            <div className="stat-body">
              <div className="stat-value">3,412</div>
              <div className="stat-label">Attempts</div>
            </div>
          </div>
        </div>

        <div className="admin-body">
          <div className="admin-left">
            <div className="chart-card">
              <div className="chart-title">Average Score by Quiz</div>
              <div className="chart-data">
                <div className="score-row">
                  <div className="score-label">Java Programming Basics</div>
                  <div className="bar-track"><div className="bar-fill" style={{width: '82%'}} /></div>
                  <div className="score-val">82%</div>
                </div>
                <div className="score-row">
                  <div className="score-label">Data Structures Quiz</div>
                  <div className="bar-track"><div className="bar-fill" style={{width: '76%'}} /></div>
                  <div className="score-val">76%</div>
                </div>
                <div className="score-row">
                  <div className="score-label">Web Development MCQ</div>
                  <div className="bar-track"><div className="bar-fill" style={{width: '74%'}} /></div>
                  <div className="score-val">74%</div>
                </div>
              </div>
            </div>

          </div>

          <div className="admin-right">
            <div className="small-card completion">
              <div className="small-title">Completion Rate</div>
              <div className="small-value">82%</div>
              <div className="small-sub">+15% this month</div>
            </div>

            <div className="small-card recent-exams">
              <div className="small-title">Recent Exams</div>
              <ul>
                <li>Java Programming Basics <span className="muted">120 Students</span></li>
                <li>Data Structures Quiz <span className="muted">85 Students</span></li>
                <li>Web Development MCQ <span className="muted">95 Students</span></li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
