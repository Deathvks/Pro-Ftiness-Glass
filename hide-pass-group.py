import sys

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Revert previous change
content = content.replace('{hasPassword && (\n<button type="button" onClick={() => setShowPasswordModal(true)}', '<button type="button" onClick={() => setShowPasswordModal(true)}')
content = content.replace('</button>\n)}', '</button>')

# Wrap the whole block instead
old_block = """        {/* Group 2: Seguridad */}
        <div className="mb-6">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-4">Seguridad</h2>
            <div className="bg-bg-secondary rounded-[24px] shadow-sm ring-1 ring-glass-border overflow-hidden">
                <button type="button" onClick={() => setShowPasswordModal(true)} className="group w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[12px] bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-secondary ring-1 ring-glass-border shadow-sm shrink-0 group-hover:bg-accent/10 group-hover:text-accent group-hover:ring-accent/30 transition-colors">
                            <Key size={18} strokeWidth={2} />
                        </div>
                        <span className="text-[15px] font-medium text-text-primary">{hasPassword ? "Cambiar contraseña" : "Crear contraseña"}</span>
                    </div>
                    <ChevronRight size={18} className="text-text-muted" />
                </button>
            </div>
        </div>"""

new_block = """        {/* Group 2: Seguridad */}
        {hasPassword && (
          <div className="mb-6">
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-4">Seguridad</h2>
              <div className="bg-bg-secondary rounded-[24px] shadow-sm ring-1 ring-glass-border overflow-hidden">
                  <button type="button" onClick={() => setShowPasswordModal(true)} className="group w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[12px] bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-secondary ring-1 ring-glass-border shadow-sm shrink-0 group-hover:bg-accent/10 group-hover:text-accent group-hover:ring-accent/30 transition-colors">
                              <Key size={18} strokeWidth={2} />
                          </div>
                          <span className="text-[15px] font-medium text-text-primary">Cambiar contraseña</span>
                      </div>
                      <ChevronRight size={18} className="text-text-muted" />
                  </button>
              </div>
          </div>
        )}"""

content = content.replace(old_block, new_block)

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
