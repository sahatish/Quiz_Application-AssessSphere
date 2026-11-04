import sys

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Update Fullscreen warning (in UnifiedAssessment.jsx)
    if 'UnifiedAssessment' in filepath:
        old_warning_btn = "setViolationPopup(null);\n                  setTimeout(() => {"
        new_warning_btn = "setViolationPopup(null);\n                  try { document.documentElement.requestFullscreen().catch(() => {}) } catch(e) {}\n                  setTimeout(() => {"
        code = code.replace(old_warning_btn, new_warning_btn)

    # 2. Add Zoom controls (in both)
    # We need to add state and the buttons.
    if 'const [zoomLevel, setZoomLevel] = useState(1)' not in code:
        # insert state around where other states are
        code = code.replace('const [currentQuestion, setCurrentQuestion] = useState(0)',
                            'const [currentQuestion, setCurrentQuestion] = useState(0)\n  const [zoomLevel, setZoomLevel] = useState(1)')
        
        # In QuizAttempt it might be different:
        code = code.replace('const [current, setCurrent] = useState(0)',
                            'const [current, setCurrent] = useState(0)\n  const [zoomLevel, setZoomLevel] = useState(1)')

    # Add the ZoomIn/ZoomOut lucide icons import
    if 'ZoomIn' not in code:
        code = code.replace('import {', 'import {\n  ZoomIn, ZoomOut,')

    # Find the image tag and wrap it or modify its style
    # Usually: <img src={...} alt="..." style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    # First, let's find the image container.
    old_img_container_start = "maxWidth: 800, margin: '0 auto', flex: 1"
    new_img_container_start = "maxWidth: 800, margin: '0 auto', flex: 1, position: 'relative', overflow: 'hidden'"
    code = code.replace(old_img_container_start, new_img_container_start)

    # Let's add the zoom buttons right above the image
    img_tag_start = "<img"
    img_tag_replacement = """
                        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 8, zIndex: 10 }}>
                          <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))} className="btn-ghost" style={{ padding: 8, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }} title="Zoom In"><ZoomIn size={18} /></button>
                          <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} className="btn-ghost" style={{ padding: 8, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }} title="Zoom Out"><ZoomOut size={18} /></button>
                          <button onClick={() => setZoomLevel(1)} className="btn-ghost" style={{ padding: '8px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', fontSize: 12, fontWeight: 700 }}>Reset</button>
                        </div>
                        <img"""
    
    # Let's target the exact image style to add the transform
    old_img_style = "width: '100%', height: '100%', objectFit: 'contain'"
    new_img_style = "width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${zoomLevel})`, transformOrigin: 'center', transition: 'transform 0.2s ease-out'"
    
    if "ZoomIn size={18}" not in code:
        code = code.replace(old_img_style, new_img_style)
        # only replace the first occurrence of <img in that section
        parts = code.split('objectFit: \'contain\'')
        if len(parts) > 1:
            code = code.replace('<img\n                              src={`', img_tag_replacement + '\n                              src={`')

    # 3. Restructure layout container (remove margins, make it one unified block)
    old_grid = '<div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 items-start">'
    new_grid = '<div className="max-w-[1400px] mx-auto card overflow-hidden">\n              <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[var(--glass-border)]">'
    code = code.replace(old_grid, new_grid)

    code = code.replace('<div className="lg:col-span-2 flex flex-col gap-6" style={{ height: \'100%\' }}>',
                        '<div className="lg:col-span-2 flex flex-col gap-6" style={{ height: \'100%\', padding: 24 }}>')
    
    code = code.replace('<div className="card flex flex-col p-5 md:p-8" style={{ height: \'100%\', minHeight: 400 }}>',
                        '<div className="flex flex-col" style={{ height: \'100%\', minHeight: 400 }}>')
    
    code = code.replace('<div className="lg:col-span-1" style={{ display: \'flex\', flexDirection: \'column\' }}>',
                        '<div className="lg:col-span-1" style={{ display: \'flex\', flexDirection: \'column\', padding: 24 }}>')

    code = code.replace('<div className="lg:col-span-1 flex flex-col" style={{ gap: 24 }}>',
                        '<div className="lg:col-span-1 flex flex-col" style={{ gap: 24, padding: 24 }}>')
    
    code = code.replace('<div className="lg:col-span-1" style={{ display: \'flex\', flexDirection: \'column\', gap: 24 }}>',
                        '<div className="lg:col-span-1" style={{ display: \'flex\', flexDirection: \'column\', gap: 24, padding: 24 }}>')

    # remove inner card classes from middle and right columns
    code = code.replace('<div className="card flex-1" style={{ display: \'flex\', flexDirection: \'column\' }}>',
                        '<div className="flex-1" style={{ display: \'flex\', flexDirection: \'column\' }}>')
    
    code = code.replace('<div className="card" style={{ padding: 24 }}>',
                        '<div style={{ padding: 0 }}>')
    code = code.replace('<div className="card" style={{ padding: 24, position: \'sticky\', top: 96 }}>',
                        '<div style={{ padding: 0, position: \'sticky\', top: 96 }}>')

    code = code.replace('<div className="card flex-1 p-5 md:p-8" style={{ display: \'flex\', flexDirection: \'column\' }}>',
                        '<div className="flex-1" style={{ display: \'flex\', flexDirection: \'column\' }}>')

    # Add the closing </div> for the new outer card wrapper.
    # In UnifiedAssessment.jsx:
    #                 </div>
    #               </div>
    #             </div>
    #           </div>
    #         ) : (
    
    # We will just write the code out
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)

process_file('c:/Users/nayak/H/Vault_Project/quiz-app/quiz-frontend/src/pages/student/UnifiedAssessment.jsx')
process_file('c:/Users/nayak/H/Vault_Project/quiz-app/quiz-frontend/src/pages/student/QuizAttempt.jsx')
print("Done")
