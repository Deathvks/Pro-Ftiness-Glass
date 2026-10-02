import sys
import re

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'(\s*)<div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-2 px-2">\s*\{reqs\.map.*?</div>\s*</div>', re.DOTALL)

new_grid = r'''\1{newPassword.length > 0 && (
\1  <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-2 px-2 animate-[fade-in-down_0.2s_ease-out]">
\1    {reqs.map(r => (
\1      <div key={r.id} className="flex items-center gap-1.5">
\1        {r.valid ? (
\1          <CheckCircle2 size={12} className="text-green-500 shrink-0" />
\1        ) : (
\1          <div className="w-3 h-3 rounded-full border border-glass-border shrink-0" />
\1        )}
\1        <span className={`text-[10px] sm:text-[11px] transition-colors ${r.valid ? 'text-text-primary' : 'text-text-secondary'}`}>
\1          {r.label}
\1        </span>
\1      </div>
\1    ))}
\1  </div>
\1)}'''

content = pattern.sub(new_grid, content)

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done dynamic reqs update")
