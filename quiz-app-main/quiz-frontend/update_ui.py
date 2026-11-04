import sys

file_path = "c:/Users/nayak/H/Vault_Project/quiz-app/quiz-frontend/src/pages/student/UnifiedAssessment.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_content = """            ) : (
              <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 items-start">
                
                {/* Left Side: Question Text & Image (50%) */}
                <div className="lg:col-span-2 flex flex-col gap-6" style={{ height: '100%' }}>
                  <AnimatePresence mode="wait">
                    <motion.div key={currentQuestion} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                      className="card flex flex-col p-5 md:p-8" style={{ height: '100%', minHeight: 400 }}>

                      {/* Question Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(37,99,235,0.15)', color: 'var(--primary-400)', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {currentQuestion + 1}
                          </div>
                          <span style={{ fontSize: 14, color: 'var(--text-sec)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Question {currentQuestion + 1} of {totalQuestions}
                          </span>
                          {markedForReview.has(questions[currentQuestion]?.id) && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '3px 8px' }}>
                              <Flag size={10} /> Marked for Review
                            </span>
                          )}
                        </div>

                        <button onClick={() => toggleReview(questions[currentQuestion]?.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                            background: markedForReview.has(questions[currentQuestion]?.id) ? 'rgba(245,158,11,0.15)',
                            color: markedForReview.has(questions[currentQuestion]?.id) ? '#f59e0b' : 'var(--text-sec)',
                          }}>
                          <Flag size={13} /> {markedForReview.has(questions[currentQuestion]?.id) ? 'Unmark' : 'Mark for Review'}
                        </button>
                      </div>

                      {/* Question Text */}
                      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.5, marginBottom: questions[currentQuestion]?.questionImage ? 24 : 0 }}>
                        {questions[currentQuestion]?.questionText}
                      </h2>
                      
                      {/* Image */}
                      {questions[currentQuestion]?.questionImage && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, overflow: 'hidden' }}>
                          <img src={questions[currentQuestion]?.questionImage} alt="Question" style={{ width: '100%', height: '100%', maxHeight: 450, objectFit: 'contain' }} />
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Middle Section: Options (25%) */}
                <div className="lg:col-span-1 flex flex-col gap-6" style={{ height: '100%' }}>
                  <div className="card flex flex-col p-5 md:p-8" style={{ height: '100%', minHeight: 400 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
                      {[
                        { key: 'A', val: questions[currentQuestion]?.optionA },
                        { key: 'B', val: questions[currentQuestion]?.optionB },
                        { key: 'C', val: questions[currentQuestion]?.optionC },
                        { key: 'D', val: questions[currentQuestion]?.optionD }
                      ].filter(o => o.val).map(opt => {
                        const q = questions[currentQuestion]
                        const isMulti = q?.multiAnswer === true
                        const isSelected = answers[q?.id]?.split(',').filter(Boolean).includes(opt.key)
                        return (
                          <div key={opt.key} onClick={() => selectAnswer(q?.id, opt.key, q?.quizAttemptId, isMulti)}
                            className={`option-card ${isSelected ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 14, cursor: 'pointer', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`, background: isSelected ? 'rgba(37,99,235,0.08)' : 'var(--glass-bg)', transition: 'all 0.15s' }}>
                            <div style={{
                              width: 22, height: 22, flexShrink: 0,
                              borderRadius: isMulti ? 4 : '50%',
                              border: isSelected ? '2px solid var(--primary-400)' : '2px solid var(--glass-border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: isSelected ? 'rgba(37,99,235,0.1)' : 'transparent'
                            }}>
                              {isSelected && <div style={{ width: isMulti ? 12 : 10, height: isMulti ? 12 : 10, borderRadius: isMulti ? 2 : '50%', background: 'var(--primary-400)' }} />}
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 500, color: isSelected ? 'var(--primary)' : 'var(--text-sec)' }}>{opt.val}</span>
                          </div>
                        )
                      })}
                      {questions[currentQuestion]?.multiAnswer && (
                        <div style={{ fontSize: 12, color: 'var(--text-sec)', fontStyle: 'italic', marginTop: 4, textAlign: 'center' }}>✦ Select all that apply</div>
                      )}
                    </div>

                    {/* Nav Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button disabled={currentQuestion === 0} onClick={() => setCurrentQuestion(c => c - 1)} className="btn-sec flex-1" style={{ opacity: currentQuestion === 0 ? 0.3 : 1, padding: '12px 0', justifyContent: 'center' }}>
                          <ChevronLeft size={16} /> Prev
                        </button>
                        
                        {currentQuestion < totalQuestions - 1 ? (
                          <button onClick={() => setCurrentQuestion(c => c + 1)} className="btn-primary flex-1" style={{ padding: '12px 0', justifyContent: 'center' }}>
                            Next <ChevronRight size={16} />
                          </button>
                        ) : codingTests.length > 0 ? (
                          <button onClick={() => setCurrentSection('coding')} className="btn-primary flex-1" style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', padding: '12px 0', justifyContent: 'center' }}>
                            Coding <ChevronRight size={16} />
                          </button>
                        ) : (
                          <button onClick={() => setShowConfirm(true)} className="btn-primary flex-1" style={{ padding: '12px 0', justifyContent: 'center' }}>
                            Submit <CheckCircle2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Question Navigation Panel (25%) */}
                <div className="lg:col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>\n"""

lines = lines[:670] + [new_content] + lines[806:]

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(lines)
