import sys

file_path = "c:/Users/nayak/H/Vault_Project/quiz-app/quiz-frontend/src/pages/student/QuizAttempt.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_content = """        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 items-start" style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* Left Side: Question Text & Image (50%) */}
          <div className="lg:col-span-2 flex flex-col gap-6" style={{ height: '100%' }}>
            <AnimatePresence mode="wait">
              <motion.div key={current} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                className="card flex flex-col p-5 md:p-8" style={{ height: '100%', minHeight: 400 }}>

                {/* Question header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(37,99,235,0.15)', color: 'var(--primary-400)', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {current + 1}
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--text-sec)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Question {current + 1} of {questions.length}
                    </span>
                    {isMarked && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '3px 8px' }}>
                        <Flag size={10} /> Marked for Review
                      </span>
                    )}
                  </div>
                  {/* Mark for review button */}
                  <button
                    onClick={() => q && toggleReview(q.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                      background: isMarked ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                      color: isMarked ? '#f59e0b' : 'var(--text-sec)',
                    }}
                  >
                    <Flag size={13} />
                    {isMarked ? 'Unmark' : 'Mark for Review'}
                  </button>
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.5, marginBottom: q?.questionImage ? 24 : 0 }}>
                  {q?.questionText}
                </h2>

                {/* Image */}
                {q?.questionImage && (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, overflow: 'hidden' }}>
                    <img src={q.questionImage} alt="Question" style={{ width: '100%', height: '100%', maxHeight: 450, objectFit: 'contain' }} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Middle Section: Options (25%) */}
          <div className="lg:col-span-1 flex flex-col gap-6" style={{ height: '100%' }}>
            <div className="card flex flex-col p-5 md:p-8" style={{ height: '100%', minHeight: 400 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
                {options.map(({ key, val }) => {
                  const sel = answers[q.id]?.split(',').includes(key)
                  return (
                    <button key={key} onClick={() => selectAnswer(q.id, key)} className={`option-btn ${sel ? 'selected' : ''}`} style={{ padding: '16px 20px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 16, background: sel ? 'rgba(37,99,235,0.08)' : 'var(--glass-bg)', border: `1px solid ${sel ? 'var(--primary)' : 'var(--glass-border)'}`, borderRadius: 14 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: sel ? 'rgba(37,99,235,0.1)' : 'transparent', border: sel ? '2px solid var(--primary-400)' : '2px solid var(--glass-border)', color: sel ? 'var(--primary)' : 'var(--text-sec)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {sel ? <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--primary-400)' }} /> : key}
                      </div>
                      <span style={{ flex: 1, fontSize: 15, textAlign: 'left', color: sel ? 'var(--primary)' : 'var(--text-main)', fontWeight: 500 }}>{val}</span>
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} className="btn-sec flex-1" style={{ padding: '12px 0', fontSize: 14, opacity: current === 0 ? 0.4 : 1, cursor: current === 0 ? 'not-allowed' : 'pointer', justifyContent: 'center' }}>
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))} disabled={current === questions.length - 1} className="btn-primary flex-1" style={{ padding: '12px 0', fontSize: 14, opacity: current === questions.length - 1 ? 0.4 : 1, cursor: current === questions.length - 1 ? 'not-allowed' : 'pointer', justifyContent: 'center' }}>
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Question Navigation Panel (25%) */}
          <div className="lg:col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>\n"""

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, alignItems: 'start' }}>" in line:
        start_idx = i
    if "          {/* Right: Navigation Grid */}" in line or "          {/* Right: Navigation */}" in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    lines = lines[:start_idx] + [new_content] + lines[end_idx+1:]
    with open(file_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print("Updated QuizAttempt.jsx")
else:
    print("Failed to find replacement indices.", start_idx, end_idx)
