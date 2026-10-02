import sys

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add confirmNewPassword state
old_state = """  const ChangePasswordModal = ({ onClose, hasPassword, updateUserAccount, handleLogout, addToast, baseInputClasses }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);"""

new_state = """  const ChangePasswordModal = ({ onClose, hasPassword, updateUserAccount, handleLogout, addToast, baseInputClasses }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);"""
content = content.replace(old_state, new_state)

# Update isValid logic
old_valid = """    const isValid = reqs.every(r => r.valid) && (!hasPassword || currentPassword.length > 0);"""
new_valid = """    const isValid = reqs.every(r => r.valid) && (!hasPassword || currentPassword.length > 0) && newPassword === confirmNewPassword;"""
content = content.replace(old_valid, new_valid)

# Update handleSubmit logic
old_submit = """    if (!isValid) {
      if (hasPassword && currentPassword.length === 0) {
        setError('Introduce tu contraseña actual para confirmar.');
      } else {
        setError('La nueva contraseña no cumple todos los requisitos.');
      }
      return;
    }"""
new_submit = """    if (!isValid) {
      if (hasPassword && currentPassword.length === 0) {
        setError('Introduce tu contraseña actual para confirmar.');
      } else if (!reqs.every(r => r.valid)) {
        setError('La nueva contraseña no cumple todos los requisitos.');
      } else if (newPassword !== confirmNewPassword) {
        setError('Las contraseñas no coinciden.');
      }
      return;
    }"""
content = content.replace(old_submit, new_submit)

# Update render
old_render = """            <div className="mt-1 flex flex-col gap-2">
              <span className="text-xs font-bold text-text-muted px-2">Requisitos de la nueva contraseña:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-2 px-2">
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
            </div>"""

new_render = """            <div className="mt-1 flex flex-col gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-2 px-2">
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
            </div>
            
            <div className="flex flex-col gap-1 mt-2">
              <label className="text-xs font-bold text-text-muted px-2">3. Repite nueva contraseña</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(e) => { setConfirmNewPassword(e.target.value); setError(''); }}
                  className={baseInputClasses}
                  placeholder="Repite nueva contraseña"
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirm(!showConfirm)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmNewPassword.length > 0 && (
                <div className="mt-1 flex items-center gap-1.5 px-2">
                  {newPassword === confirmNewPassword ? (
                    <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-glass-border shrink-0" />
                  )}
                  <span className={`text-[10px] sm:text-[11px] transition-colors ${newPassword === confirmNewPassword ? 'text-text-primary' : 'text-text-secondary'}`}>
                    Las contraseñas coinciden
                  </span>
                </div>
              )}
            </div>"""

content = content.replace(old_render, new_render)

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Profile")
