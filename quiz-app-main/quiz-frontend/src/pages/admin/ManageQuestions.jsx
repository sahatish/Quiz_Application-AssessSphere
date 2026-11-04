import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../../components/Layout'
import { questionApi, studentQuizApi } from '../../api/axios'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, HelpCircle, X, Loader2, Check, ArrowLeft, UploadCloud } from 'lucide-react'

const OPTIONS = ['A', 'B', 'C', 'D']

function QuestionModal({ question, quizId, onClose, onSave }) {
  const isTF = question?.optionC === '' && question?.optionD === ''
  const [qType, setQType] = useState(isTF ? 'TF' : 'MCQ')
  const [form, setForm] = useState({ quizId: Number(quizId), questionText: '', questionImage: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', marks: 1, ...question })
  const [loading, setLoading] = useState(false)

  const handleTypeChange = (type) => {
    setQType(type)
    if (type === 'TF') {
      setForm(f => ({ ...f, optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctAnswer: 'A' }))
    } else {
      setForm(f => ({ 
        ...f, 
        optionA: f.optionA === 'True' ? '' : f.optionA,
        optionB: f.optionB === 'False' ? '' : f.optionB,
        optionC: f.optionC === 'Option C' ? '' : f.optionC,
        optionD: f.optionD === 'Option D' ? '' : f.optionD
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.correctAnswer) { toast.error('Please select at least one correct answer'); return }
    setLoading(true)
    try {
      // For True/False, ensure C and D are sent as empty strings
      const payload = { ...form, marks: Number(form.marks), quizId: Number(quizId) }
      if (qType === 'TF') {
        payload.optionC = ''
        payload.optionD = ''
      }
      
      if (question?.id) { await questionApi.update(question.id, payload); toast.success('Updated!'); }
      else { await questionApi.add(payload); toast.success('Added!'); }
      onSave()
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving question') }
    finally { setLoading(false) }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm(f => ({ ...f, questionImage: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const currentOptions = qType === 'TF' ? ['A', 'B'] : OPTIONS

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="modal-box" style={{ margin: 'auto', maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)' }}>{question?.id ? 'Edit Question' : 'Add Question'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button onClick={() => handleTypeChange('MCQ')} style={{ flex: 1, padding: 10, borderRadius: 8, background: qType === 'MCQ' ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${qType === 'MCQ' ? 'var(--primary)' : 'transparent'}`, color: qType === 'MCQ' ? 'var(--primary-400)' : 'var(--text-sec)', fontWeight: 600, cursor: 'pointer' }}>Multiple Choice</button>
          <button onClick={() => handleTypeChange('TF')} style={{ flex: 1, padding: 10, borderRadius: 8, background: qType === 'TF' ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${qType === 'TF' ? 'var(--primary)' : 'transparent'}`, color: qType === 'TF' ? 'var(--primary-400)' : 'var(--text-sec)', fontWeight: 600, cursor: 'pointer' }}>True / False</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Question Text *</label>
          <textarea required rows={3} value={form.questionText} onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))} className="input-field" style={{ resize: 'none' }} /></div>
          
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Question Image (Optional)</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="input-field" style={{ padding: '8px' }} />
            {form.questionImage && (
              <div style={{ position: 'relative', marginTop: 12, display: 'inline-block' }}>
                <img src={form.questionImage} alt="Question Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid var(--glass-border)' }} />
                <button type="button" onClick={() => setForm(f => ({ ...f, questionImage: '' }))} style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} /></button>
              </div>
            )}
          </div>

          {currentOptions.map(opt => (
            <div key={opt}><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Option {opt} *</label>
            <input required value={form[`option${opt}`]} onChange={e => setForm(f => ({ ...f, [`option${opt}`]: e.target.value }))} className="input-field" /></div>
          ))}
          <div className="responsive-grid-2" style={{ gap: 16 }}>
            <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Correct Answer(s) *</label>
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              {currentOptions.map(o => (
                <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text-main)' }}>
                  <input type={qType === 'TF' ? 'radio' : 'checkbox'} name="correctAnswer" checked={form.correctAnswer?.split(',').includes(o)} onChange={e => {
                    if (qType === 'TF') {
                      setForm(f => ({ ...f, correctAnswer: o }))
                    } else {
                      const current = new Set(form.correctAnswer ? form.correctAnswer.split(',') : [])
                      if (e.target.checked) current.add(o)
                      else current.delete(o)
                      setForm(f => ({ ...f, correctAnswer: Array.from(current).sort().join(',') }))
                    }
                  }} /> Option {o}
                </label>
              ))}
            </div></div>
            <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Marks</label>
            <input type="number" min="1" value={form.marks} onChange={e => setForm(f => ({ ...f, marks: e.target.value }))} className="input-field" /></div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>{loading ? <Loader2 size={16} className="spin" /> : <Check size={16} />} {question?.id ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}


export default function ManageQuestions() {
  const { id: quizId } = useParams()
  const [questions, setQuestions] = useState([])
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [importModal, setImportModal] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchData = () => {
    Promise.all([questionApi.getForAdmin(quizId), studentQuizApi.getById(quizId).catch(() => ({ data: { data: null } }))])
      .then(([qs, qz]) => { setQuestions(qs.data.data || []); setQuiz(qz.data.data); })
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchData() }, [quizId])

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(deleteTarget.id)
    try { 
      await questionApi.delete(deleteTarget.id)
      toast.success('Question deleted')
      fetchData()
    } catch { 
      toast.error('Delete failed')
    } finally {
      setDeleting(null)
      setDeleteTarget(null)
    }
  }

  return (
    <Layout title={quiz?.title || 'Questions'} subtitle={`${questions.length} questions`}
      action={
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/admin/quizzes" className="btn-ghost" style={{ padding: '8px 16px', fontSize: 13, textDecoration: 'none' }}><ArrowLeft size={14} /> Back</Link>
          <button onClick={() => setImportModal(true)} className="btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}><UploadCloud size={14} /> Import Questions</button>
          <button onClick={() => setModal({})} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}><Plus size={14} /> Add Question</button>
        </div>
      }>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
      : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {questions.map((q, i) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(37,99,235,0.1)', color: 'var(--primary-400)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  Q{i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.6, marginBottom: q.questionImage ? 12 : 20 }}>
                    {q.questionText
                      ? q.questionText
                          .split(/(?=Statement-[IVX]+:|Assertion:|Reason:)/)
                          .filter(part => part.trim() !== '')
                          .map((part, idx, arr) => (
                            <span key={idx} style={{ display: 'block', marginBottom: idx < arr.length - 1 ? 8 : 0 }}>
                              {part.trim()}
                            </span>
                          ))
                      : null}
                  </p>
                  {q.questionImage && (
                    <div style={{ marginBottom: 20 }}>
                      <img src={q.questionImage} alt="Question" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid var(--glass-border)' }} />
                    </div>
                  )}
                  <div className="responsive-grid-2" style={{ marginBottom: 20 }}>
                    {OPTIONS.filter(opt => q[`option${opt}`] && q[`option${opt}`].trim() !== '').map(opt => (
                      <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 8, background: q.correctAnswer?.split(',').includes(opt) ? 'rgba(56,189,248,0.1)' : 'var(--glass-bg)', border: `1px solid ${q.correctAnswer?.split(',').includes(opt) ? 'rgba(56,189,248,0.3)' : 'var(--glass-border)'}` }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, background: q.correctAnswer?.split(',').includes(opt) ? 'var(--primary)' : 'var(--glass-bg)', color: q.correctAnswer?.split(',').includes(opt) ? '#fff' : 'var(--text-sec)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{opt}</div>
                        <span style={{ fontSize: 13, color: q.correctAnswer?.split(',').includes(opt) ? 'var(--primary)' : 'var(--text-main)' }}>{q[`option${opt}`]}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="badge badge-active">Correct Answer: {q.correctAnswer} • {q.marks || 1} mark{q.marks !== 1 ? 's' : ''}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setModal(q)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'var(--text-sec)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}><Pencil size={14} /></button>
                      <button onClick={() => setDeleteTarget(q)} disabled={deleting === q.id} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                        {deleting === q.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {questions.length === 0 && <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-sec)' }}><HelpCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} /><p>No questions added yet.</p></div>}
        </div>
      )}
      <AnimatePresence>
        {modal !== null && <QuestionModal question={modal?.id ? modal : null} quizId={quizId} onClose={() => setModal(null)} onSave={() => { setModal(null); fetchData(); }} />}
        {importModal && <ImportModal quizId={quizId} onClose={() => setImportModal(false)} onImported={() => { setImportModal(false); fetchData(); }} />}
        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDeleteTarget(null)} style={{ alignItems: 'center' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-box"
              style={{ margin: 'auto', maxWidth: 400, width: '90%', padding: 24 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Delete Question</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-sec)', margin: '4px 0 0' }}>This action cannot be undone.</p>
                </div>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-main)', marginBottom: 24, lineHeight: 1.5 }}>
                Are you sure you want to permanently delete this question?
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setDeleteTarget(null)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} disabled={deleting !== null}>
                  Cancel
                </button>
                <button onClick={confirmDelete} style={{ flex: 1, justifyContent: 'center', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: deleting !== null ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: deleting !== null ? 0.7 : 1 }} disabled={deleting !== null}>
                  {deleting !== null ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />} 
                  {deleting !== null ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  )
}

function ImportModal({ quizId, onClose, onImported }) {
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const fileText = await file.text()
    setContent(fileText)
  }

  const parseCSVRows = (text) => {
    const rows = []
    let currentRow = []
    let currentField = ''
    let inQuotes = false
    let physicalLine = 1
    let rowStartLine = 1

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const nextChar = text[i + 1]

      if (char === '\n') {
        physicalLine++
      }

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"'
          i++
          if (text[i] === '\n') physicalLine++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField.trim())
        currentField = ''
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++
          physicalLine++
        }
        currentRow.push(currentField.trim())
        if (currentRow.some(field => field !== '')) {
          rows.push({ fields: currentRow, startLine: rowStartLine })
        }
        currentRow = []
        currentField = ''
        rowStartLine = physicalLine
      } else {
        currentField += char
      }
    }

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim())
      if (currentRow.some(field => field !== '')) {
        rows.push({ fields: currentRow, startLine: rowStartLine })
      }
    }

    return rows
  }

  const parseQuestions = () => {
    const trimmed = content.trim()
    if (!trimmed) {
      throw new Error('Paste JSON or CSV text for import.')
    }

    let rawQuestions = []
    if (trimmed.startsWith('[')) {
      rawQuestions = JSON.parse(trimmed)
    } else {
      const parsedRows = parseCSVRows(content)
      rawQuestions = parsedRows.map((rowObj) => {
        const { fields, startLine } = rowObj
        if (fields.length < 4) {
          throw new Error(`Line ${startLine} requires at least 4 values (for True/False) or 6 values (for Multiple Choice)`)
        }

        let marks = 1
        let lastIndex = fields.length - 1

        // Check for trailing marks (strip brackets if user typed them like [5])
        let rawMarks = fields[lastIndex].trim().replace(/^\[|\]$/g, '')
        if (fields.length >= 5 && !isNaN(rawMarks) && rawMarks !== '') {
          marks = Number(rawMarks)
          lastIndex--
        }

        const correctAnswers = []
        let rawAnswer = fields[lastIndex].trim()

        // Check if True/False or MCQ based on remaining fields
        // If remaining is 3, it's True/False (ques, optA, optB) -> lastIndex = 3 (0,1,2,3)
        // If remaining is 5, it's MCQ (ques, optA, optB, optC, optD) -> lastIndex = 5 (0,1,2,3,4,5)

        let isTF = false;
        if (lastIndex === 3) {
          isTF = true;
        } else if (lastIndex < 5) {
           throw new Error(`Line ${startLine} has an invalid structure. Expected 4 fields for True/False, or 6 fields for Multiple Choice.`)
        }

        const validOptionsSet = new Set(['A', 'B', 'C', 'D'])

        // Parse Multiple Choice Answers
        if (!isTF) {
           while (lastIndex >= 5 && validOptionsSet.has(fields[lastIndex].toUpperCase())) {
             correctAnswers.unshift(fields[lastIndex].toUpperCase())
             lastIndex--
           }
           if (correctAnswers.length === 0 && lastIndex >= 4) {
             const potentialAns = fields[lastIndex].toUpperCase().replace(/\s+/g, '')
             if (/^[A-D](,[A-D])*$/.test(potentialAns)) {
               correctAnswers.push(potentialAns)
               lastIndex--
             }
           }
           if (lastIndex < 3 || correctAnswers.length === 0) {
             throw new Error(`Line ${startLine} has an invalid structure for Multiple Choice. Option A, B, C, D and a valid Correct Answer (A, B, C, or D) are required.`)
           }
        } else {
           // Parse True/False Answers
           rawAnswer = fields[lastIndex].trim().toLowerCase()
           const optA = fields[lastIndex - 1].trim().toLowerCase()
           const optB = fields[lastIndex - 2].trim().toLowerCase()

           if (rawAnswer === optA || rawAnswer === 'a' || rawAnswer === 'true' && optA === 'true') {
              correctAnswers.push('A')
           } else if (rawAnswer === optB || rawAnswer === 'b' || rawAnswer === 'false' && optB === 'false') {
              correctAnswers.push('B')
           } else if (rawAnswer === 'true') {
              correctAnswers.push('A')
           } else if (rawAnswer === 'false') {
              correctAnswers.push('B')
           } else {
              throw new Error(`Line ${startLine} True/False answer "${rawAnswer}" could not be matched to A or B.`)
           }
           lastIndex--
        }

        let optionD = isTF ? '' : fields[lastIndex--]
        let optionC = isTF ? '' : fields[lastIndex--]
        let optionB = fields[lastIndex--]
        let optionA = fields[lastIndex--]

        const questionText = fields.slice(0, lastIndex + 1).join(',')

        if (!questionText) {
          throw new Error(`Line ${startLine} has empty question text.`)
        }

        return {
          questionText,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer: correctAnswers.join(','),
          marks,
          quizId: Number(quizId),
        }
      })
    }

    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      throw new Error('No valid questions found for import.')
    }

    return rawQuestions.map((question) => ({
      ...question,
      quizId: Number(quizId),
      marks: Number(question.marks || 1),
      correctAnswer: String(question.correctAnswer).toUpperCase(),
    }))
  }

  const handleImport = async () => {
    setLoading(true)
    try {
      const questions = parseQuestions()
      await questionApi.bulkAdd(quizId, questions)
      toast.success(`${questions.length} questions imported successfully`)
      onImported()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ overflowY: 'auto', alignItems: 'flex-start' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="modal-box" style={{ margin: '40px auto', maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)' }}>Import Questions</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Paste JSON or CSV</label>
            <textarea rows={10} value={content} onChange={e => setContent(e.target.value)} className="input-field" style={{ resize: 'vertical', minHeight: 240 }} placeholder={`Paste JSON array or CSV rows:
questionText,optionA,optionB,optionC,optionD,correctAnswer,marks`} />
          </div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)' }}>
            Or upload a file
            <input type="file" accept=".json,.txt,.csv" onChange={handleFile} style={{ display: 'block', marginTop: 10 }} />
            {fileName && <div style={{ marginTop: 8, color: 'var(--text-main)', fontSize: 13 }}>Loaded: {fileName}</div>}
          </label>
          <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.04)' }}>
            <p style={{ marginBottom: 8, fontWeight: 700 }}>CSV format</p>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.7 }}>
              <strong>Multiple Choice:</strong> questionText, optionA, optionB, optionC, optionD, correctAnswer, marks.<br/>
              <strong>True / False:</strong> questionText, optionA, optionB, correctAnswer, marks.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button onClick={handleImport} disabled={loading} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? <Loader2 size={16} className="spin" /> : <Check size={16} />} Import
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
