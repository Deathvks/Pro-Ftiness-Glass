import sys

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the currentPassword field have a distinct label
old_current_input = """            {hasPassword && (
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setError(''); }}
                  className={baseInputClasses}
                  placeholder="Contraseña actual"
                />
                <button 
                  type="button" 
                  onClick={() => setShowCurrent(!showCurrent)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            )}"""

new_current_input = """            {hasPassword && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-muted px-2">1. Confirma tu contraseña actual</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setError(''); }}
                    className={baseInputClasses}
                    placeholder="Contraseña actual"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrent(!showCurrent)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
                  >
                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}"""

old_new_input = """            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                className={baseInputClasses}
                placeholder="Nueva contraseña"
              />
              <button 
                type="button" 
                onClick={() => setShowNew(!showNew)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="mt-1 flex flex-col gap-2">
              <span className="text-xs font-bold text-text-muted px-2">Requisitos de la nueva contraseña:</span>"""

new_new_input = """            <div className="flex flex-col gap-1 mt-2">
              <label className="text-xs font-bold text-text-muted px-2">2. Elige una nueva contraseña</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                  className={baseInputClasses}
                  placeholder="Nueva contraseña"
                />
                <button 
                  type="button" 
                  onClick={() => setShowNew(!showNew)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mt-1 flex flex-col gap-2">
              <span className="text-xs font-bold text-text-muted px-2">Requisitos de la nueva contraseña:</span>"""

content = content.replace(old_current_input, new_current_input)
content = content.replace(old_new_input, new_new_input)

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
