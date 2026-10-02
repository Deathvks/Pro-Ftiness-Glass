import sys

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add showPasswordModal state
content = content.replace(
    "const [showUnsavedModal, setShowUnsavedModal] = useState(false);",
    "const [showUnsavedModal, setShowUnsavedModal] = useState(false);\n  const [showPasswordModal, setShowPasswordModal] = useState(false);"
)

# 2. Update Group 1 inputs to allow full width (flex-1 ml-4 min-w-0)
content = content.replace(
    '''className="text-right bg-transparent outline-none text-text-secondary font-medium w-1/2 min-w-[100px]" placeholder="Tu usuario"''',
    '''className="text-right bg-transparent outline-none text-text-secondary font-medium flex-1 ml-4 min-w-0 truncate" placeholder="Tu usuario"'''
)
content = content.replace(
    '''className="text-right bg-transparent outline-none text-text-secondary font-medium w-1/2 min-w-[100px]" placeholder="Tu email"''',
    '''className="text-right bg-transparent outline-none text-text-secondary font-medium flex-1 ml-4 min-w-0 truncate" placeholder="Tu email"'''
)

# 3. Replace Group 2 with a Button
old_g2 = '''        {/* Group 2: Seguridad */}
        <div className="mb-6">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-4">Seguridad</h2>
            <div className="bg-bg-secondary rounded-[24px] shadow-sm ring-1 ring-glass-border overflow-hidden">
                {hasPassword && (
                <div className="group flex items-center justify-between p-4 border-b border-glass-border">
                    <div className="flex items-center gap-3 mr-2">
                        <div className="w-8 h-8 rounded-[12px] bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-secondary ring-1 ring-glass-border shadow-sm shrink-0 group-hover:bg-accent/10 group-hover:text-accent group-hover:ring-accent/30 transition-colors">
                            <Shield size={18} strokeWidth={2} />
                        </div>
                        <span className="text-[15px] font-medium text-text-primary whitespace-nowrap">Contraseña actual</span>
                    </div>
                    <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} className="text-right bg-transparent outline-none text-text-secondary font-medium w-full min-w-0" placeholder="••••••" />
                </div>
                )}
                <div className="group flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 mr-2">
                        <div className="w-8 h-8 rounded-[12px] bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-secondary ring-1 ring-glass-border shadow-sm shrink-0 group-hover:bg-accent/10 group-hover:text-accent group-hover:ring-accent/30 transition-colors">
                            <Key size={18} strokeWidth={2} />
                        </div>
                        <span className="text-[15px] font-medium text-text-primary whitespace-nowrap">Cambiar contraseña</span>
                    </div>
                    <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} className="text-right bg-transparent outline-none text-text-secondary font-medium w-full min-w-0" placeholder="••••••" />
                </div>
                {(errors.currentPassword || errors.newPassword) && (
                    <div className="px-4 pb-3">
                        {errors.currentPassword && <p className="text-xs text-red font-bold">{errors.currentPassword}</p>}
                        {errors.newPassword && <p className="text-xs text-red font-bold">{errors.newPassword}</p>}
                    </div>
                )}
            </div>
        </div>'''

new_g2 = '''        {/* Group 2: Seguridad */}
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
        </div>'''

content = content.replace(old_g2, new_g2)


# 4. Remove password check from handleSave since it's handled in the modal now
old_handle_save = '''    if (formData.newPassword) {
      if (hasPassword) {
        data.append('currentPassword', formData.currentPassword);
      }
      data.append('newPassword', formData.newPassword);
    }

    if (profileImageFile) {
      data.append('profileImage', profileImageFile);
    }

    if (
      !profileImageFile &&
      formData.username === userProfile.username &&
      formData.email === userProfile.email &&
      !formData.newPassword
    ) {
      addToast('No se detectaron cambios.', 'info');
      setIsLoading(false);
      onCancel();
      return;
    }

    try {
      await updateUserAccount(data);

      if (formData.newPassword) {
        addToast('Contrasea actualizada. Por favor, inicia sesin de nuevo.', 'success');
        handleLogout();
        return;
      }'''

new_handle_save = '''    if (profileImageFile) {
      data.append('profileImage', profileImageFile);
    }

    if (
      !profileImageFile &&
      formData.username === userProfile.username &&
      formData.email === userProfile.email
    ) {
      addToast('No se detectaron cambios.', 'info');
      setIsLoading(false);
      onCancel();
      return;
    }

    try {
      await updateUserAccount(data);'''

content = content.replace(old_handle_save, new_handle_save)

# Also fix the weird encoding symbol that might be in the file 'Contrasea' 
# Just in case, we replaced the whole block. 

# 5. Inject the new modal inside the return (at the end before AnimatePresence of showUnsavedModal)
# Let's find: <AnimatePresence>\n        {showUnsavedModal && (
injection_point = "<AnimatePresence>\n        {showUnsavedModal && ("
modal_code = '''      <AnimatePresence>
        {showPasswordModal && (
          <ChangePasswordModal
            onClose={() => setShowPasswordModal(false)}
            hasPassword={hasPassword}
            updateUserAccount={updateUserAccount}
            handleLogout={handleLogout}
            addToast={addToast}
            baseInputClasses={baseInputClasses}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUnsavedModal && ('''

content = content.replace(injection_point, modal_code)

# 6. Inject the ChangePasswordModal component definition before xport default Profile;
modal_component = '''// --- Componente: Modal de Cambiar Contraseña ---
const ChangePasswordModal = ({ onClose, hasPassword, updateUserAccount, handleLogout, addToast, baseInputClasses }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [dragY, setDragY] = useState(0);
  const [touchStartY, setTouchStartY] = useState(null);

  const reqs = [
    { id: 'length', label: '8+ caracteres', valid: newPassword.length >= 8 },
    { id: 'uppercase', label: '1 Mayúscula', valid: /[A-Z]/.test(newPassword) },
    { id: 'number', label: '1 Número', valid: /[0-9]/.test(newPassword) }
  ];
  const isValid = reqs.every(r => r.valid) && (!hasPassword || currentPassword.length > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setIsLoading(true);
    setError('');

    try {
      const data = new FormData();
      if (hasPassword) data.append('currentPassword', currentPassword);
      data.append('newPassword', newPassword);
      
      await updateUserAccount(data);
      addToast('Contraseña actualizada. Por favor, inicia sesión de nuevo.', 'success');
      handleLogout();
    } catch (err) {
      setError(err.message || 'Error al actualizar la contraseña');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end sm:justify-center items-center px-0 sm:px-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md bg-bg-secondary sm:rounded-[24px] rounded-t-[32px] p-6 pb-[calc(max(env(safe-area-inset-bottom,0px),24px))] shadow-2xl sm:border border-t border-glass-border overflow-hidden flex flex-col"
        style={{ transform: 	ranslateY(px), transition: touchStartY !== null ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)" }}
        onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
        onTouchMove={(e) => {
          if (touchStartY === null) return;
          const diff = e.touches[0].clientY - touchStartY;
          if (diff > 0) setDragY(diff);
        }}
        onTouchEnd={() => {
          if (dragY > 100) onClose();
          setDragY(0);
          setTouchStartY(null);
        }}
      >
        <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-6 sm:hidden shrink-0" />
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-[20px] bg-accent/10 flex items-center justify-center text-accent ring-1 ring-accent/30 mb-4">
            <Key size={32} strokeWidth={2} />
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-text-primary">{hasPassword ? "Cambiar Contraseña" : "Crear Contraseña"}</h3>
          <p className="text-text-secondary font-medium text-sm mt-2">
            Asegúrate de usar una contraseña segura.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="form-error-text text-center text-sm font-bold bg-red/10 p-3 rounded-[12px] text-red">{error}</p>}
          
          {hasPassword && (
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
          )}

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

          {newPassword.length > 0 && (
            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-2 px-2">
              {reqs.map(r => (
                <div key={r.id} className="flex items-center gap-2">
                  {r.valid ? (
                    <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-glass-border shrink-0" />
                  )}
                  <span className={	ext-[11px] sm:text-xs font-bold transition-colors }>
                    {r.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 mt-4">
            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="w-full py-4 bg-accent text-accent-contrast font-bold rounded-[16px] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20 flex items-center justify-center"
            >
              {isLoading ? <Spinner size={20} color="white" /> : "Guardar Contraseña"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full py-4 bg-black/5 dark:bg-white/5 text-text-primary font-bold rounded-[16px] hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;
'''

content = content.replace("export default Profile;", modal_component)

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
