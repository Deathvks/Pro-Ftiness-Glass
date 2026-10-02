import sys
import re

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We'll replace the entire ChangePasswordModal block to make sure it's 100% correct
pattern = re.compile(r'// --- Componente: Modal de Cambiar Contraseña ---.*?(?=\nexport default Profile;)', re.DOTALL)

new_modal = '''// --- Componente: Modal de Cambiar Contraseña ---
const ChangePasswordModal = ({ onClose, hasPassword, updateUserAccount, handleLogout, addToast, baseInputClasses }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useModalLock();

  const reqs = [
    { id: 'length', label: 'Al menos 12 caracteres', valid: newPassword.length >= 12 },
    { id: 'upper', label: 'Una mayúscula', valid: /[A-Z]/.test(newPassword) },
    { id: 'lower', label: 'Una minúscula', valid: /[a-z]/.test(newPassword) },
    { id: 'special', label: 'Un carácter especial (!@#$...)', valid: /[!@#$%^&*(),.?":{}|<>\-_+=\\[\\]\\/'`]/.test(newPassword) },
    { id: 'digits', label: 'No más de 3 números seguidos', valid: !/\\d{4,}/.test(newPassword) && newPassword.length > 0 }
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
    <ModalPortal>
      <div 
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out] p-0 sm:p-4 overscroll-none"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-md mt-auto sm:mt-0 rounded-t-[32px] sm:rounded-[24px] bg-bg-secondary p-6 pb-[calc(max(env(safe-area-inset-bottom,0px),24px))] sm:border border-t border-glass-border shadow-2xl flex flex-col animate-[slide-up_0.3s_ease-out] sm:animate-[scale-in_0.2s_ease-out] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
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
        </div>
      </div>
    </ModalPortal>
  );
};
'''

content = pattern.sub(new_modal, content)

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done complete modal fix")
