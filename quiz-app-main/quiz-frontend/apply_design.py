import os
import re

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    orig = content
    # Gradients
    content = re.sub(r'linear-gradient\(135deg,\s*#7c3aed,\s*#4f46e5\)', 'linear-gradient(135deg,var(--primary),var(--primary-400))', content)
    content = re.sub(r'linear-gradient\(135deg,\s*#7c3aed,\s*#38bdf8\)', 'linear-gradient(135deg,var(--primary),var(--primary-400))', content)
    
    # Colors
    content = content.replace('#7c3aed', 'var(--primary)')
    content = content.replace('#8b5cf6', 'var(--primary-400)')
    content = content.replace('#a78bfa', 'var(--primary-400)')
    
    # RGBA
    content = content.replace('rgba(124,58,237', 'rgba(37,99,235')
    
    # Brand
    content = content.replace('QuizVault', 'AssessSphere')
    
    # Apply standard greys like user script did
    content = content.replace("color: '#f1f5f9'", "color: 'var(--text-main)'")
    content = content.replace('color: "#f1f5f9"', "color: 'var(--text-main)'")
    content = content.replace("color: '#e2e8f0'", "color: 'var(--text-main)'")
    content = content.replace("color: '#cbd5e1'", "color: 'var(--text-main)'")
    content = content.replace("color: '#64748b'", "color: 'var(--text-sec)'")
    content = content.replace("color: '#94a3b8'", "color: 'var(--text-sec)'")
    content = content.replace("color: '#475569'", "color: 'var(--text-sec)'")
    content = content.replace("background: '#060818'", "background: 'var(--bg-main)'")
    content = content.replace("background: '#07090f'", "background: 'var(--bg-main)'")
    
    if orig != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {path}")

# Walk src
src_dir = os.path.join(os.path.dirname(__file__), 'src')
for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.jsx'):
            process_file(os.path.join(root, file))

print("Design application complete!")
