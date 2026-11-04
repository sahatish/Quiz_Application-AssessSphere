import os

def replace_in_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    orig = content
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
        print('Updated', path)

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx'):
            replace_in_file(os.path.join(root, file))
print('Done!')
