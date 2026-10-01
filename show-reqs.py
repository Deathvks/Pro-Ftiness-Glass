import sys

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = """            {newPassword.length > 0 && (
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-2 px-2 animate-[fade-in-down_0.2s_ease-out]">
                {reqs.map(r => (
                  <div key={r.id} className="flex items-center gap-1.5">
                    {r.valid ? (
                      <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-glass-border shrink-0" />
                    )}
                    <span className={`text-[10px] sm:text-[11px] transition-colors ${r.valid ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {r.label}
                    </span>
                  </div>
                ))}
              </div>
            )}"""

new_block = """            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-2 px-2">
              {reqs.map(r => (
                <div key={r.id} className="flex items-center gap-1.5">
                  {r.valid ? (
                    <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-glass-border shrink-0" />
                  )}
                  <span className={`text-[10px] sm:text-[11px] transition-colors ${r.valid ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {r.label}
                  </span>
                </div>
              ))}
            </div>"""

content = content.replace(old_block, new_block)

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
