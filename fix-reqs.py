import sys
import re

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_reqs = '''  const reqs = [
    { id: 'length', label: '8+ caracteres', valid: newPassword.length >= 8 },
    { id: 'uppercase', label: '1 Mayúscula', valid: /[A-Z]/.test(newPassword) },
    { id: 'number', label: '1 Número', valid: /[0-9]/.test(newPassword) }
  ];'''

new_reqs = '''  const reqs = [
    { id: 'length', label: 'Al menos 12 caracteres', valid: newPassword.length >= 12 },
    { id: 'upper', label: 'Una mayúscula', valid: /[A-Z]/.test(newPassword) },
    { id: 'lower', label: 'Una minúscula', valid: /[a-z]/.test(newPassword) },
    { id: 'special', label: 'Un carácter especial (!@#$...)', valid: /[!@#$%^&*(),.?":{}|<>\-_+=\\[\\]\\/'`]/.test(newPassword) },
    { id: 'digits', label: 'No más de 3 números seguidos', valid: !/\\d{4,}/.test(newPassword) && newPassword.length > 0 }
  ];'''

content = content.replace(old_reqs, new_reqs)

# Also conditionally render it like register screen if they want it hidden initially? 
# The user explicitly asked in a previous message: "Sigue sin aparecer mientras escribo los requerimientos de la contraseña, como en el registro."
# So they WANT it to appear ONLY when they start typing?
# Let's wrap it in {newPassword.length > 0 && ( ... )}

old_grid = '''          <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-2 px-2">
            {reqs.map(r => (
              <div key={r.id} className="flex items-center gap-2">
                {r.valid ? (
                  <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-glass-border shrink-0" />
                )}
                <span className={`text-[11px] sm:text-xs font-bold transition-colors ${r.valid ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {r.label}
                </span>
              </div>
            ))}
          </div>'''

new_grid = '''          {newPassword.length > 0 && (
            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-2 px-2">
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
          )}'''

content = content.replace(old_grid, new_grid)

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done requirements update")
