const fs = require("fs");
let content = fs.readFileSync("frontend/src/pages/Profile.jsx", "utf8");

const regex = /const DeleteConfirmationModal = \(\{[\s\S]*?export default Profile;/;

const newComponent = `const DeleteConfirmationModal = ({
  modalAction,
  isModalLoading,
  modalPassword,
  setModalPassword,
  modalError,
  setModalError,
  handleModalClose,
  handleModalConfirm,
  baseInputClasses,
  hasPassword,
}) => {
  const [dragY, setDragY] = useState(0);
  const [touchStartY, setTouchStartY] = useState(null);

  if (!modalAction) return null;

  const isDeleteAccount = modalAction === "deleteAccount";
  const title = isDeleteAccount ? "Borrar Cuenta Definitivamente" : "Borrar Historial de Datos";

  const themeConfig = isDeleteAccount 
    ? {
        ring: "border-red-500/30",
        iconBg: "bg-red-500/10",
        iconRing: "ring-red-500/30",
        text: "text-red-500",
        buttonBg: "bg-red-600",
        shadow: "shadow-red-500/20"
      }
    : {
        ring: "border-orange-500/30",
        iconBg: "bg-orange-500/10",
        iconRing: "ring-orange-500/30",
        text: "text-orange-500",
        buttonBg: "bg-orange-500",
        shadow: "shadow-orange-500/20"
      };

  const message = isDeleteAccount
    ? "¿Estás ABSOLUTAMENTE seguro? Esta acción es irreversible. Tu cuenta y todos tus datos serán eliminados permanentemente."
    : "¿Estás seguro? Todos tus registros de entrenamientos, nutrición y progreso serán eliminados. Tu cuenta se conservará.";

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end sm:justify-center items-center px-0 sm:px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-[fade-in_0.2s_ease-out]" onClick={handleModalClose} />
      
      <div 
        className={\`relative w-full max-w-md bg-bg-secondary sm:rounded-[24px] rounded-t-[32px] p-6 pb-[calc(max(env(safe-area-inset-bottom,0px),24px))] shadow-2xl sm:border border-t border-glass-border overflow-hidden flex flex-col animate-[scale-in_0.2s_ease-out] \${themeConfig.shadow}\`}
        style={{ transform: "translateY(" + dragY + "px)", transition: touchStartY !== null ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)" }}
        onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
        onTouchMove={(e) => {
          if (touchStartY === null) return;
          const diff = e.touches[0].clientY - touchStartY;
          if (diff > 0) setDragY(diff);
        }}
        onTouchEnd={() => {
          if (dragY > 100) handleModalClose();
          setDragY(0);
          setTouchStartY(null);
        }}
      >
        <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-6 sm:hidden shrink-0" />
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className={\`w-20 h-20 rounded-[24px] flex items-center justify-center mb-5 ring-1 shadow-sm \${themeConfig.iconBg} \${themeConfig.text} \${themeConfig.iconRing}\`}>
            <AlertTriangle size={40} strokeWidth={1.5} />
          </div>
          <h3 className={\`text-2xl font-extrabold tracking-tight \${themeConfig.text}\`}>{title}</h3>
          <p className="text-text-secondary font-medium text-sm mt-3 leading-relaxed px-2">
            {message}
          </p>
          {hasPassword && (
            <p className="text-sm font-bold text-text-primary mt-3">
              Escribe tu contraseña para confirmar.
            </p>
          )}
        </div>

        {hasPassword && (
          <div className="mb-6 px-2">
            <input
              type="password"
              placeholder="Contraseña actual"
              value={modalPassword}
              onChange={(e) => {
                setModalPassword(e.target.value);
                setModalError("");
              }}
              className={baseInputClasses}
              autoFocus
            />
            {modalError && <p className="form-error-text text-center text-xs mt-3 font-bold">{modalError}</p>}
          </div>
        )}

        <div className="flex flex-col gap-3 px-2">
          <button
            onClick={handleModalConfirm}
            disabled={isModalLoading || (hasPassword && !modalPassword)}
            className={\`w-full py-4 text-white font-bold rounded-[16px] hover:brightness-110 active:scale-95 transition-all shadow-lg \${themeConfig.buttonBg} disabled:opacity-50 disabled:cursor-not-allowed\`}
          >
            {isModalLoading ? <Spinner size={20} color="#ffffff" /> : \`Confirmar \${isDeleteAccount ? "Borrado" : "Limpieza"}\`}
          </button>
          <button
            onClick={handleModalClose}
            disabled={isModalLoading}
            className="w-full py-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary font-bold rounded-[16px] active:scale-95 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
`;

content = content.replace(regex, newComponent);
fs.writeFileSync("frontend/src/pages/Profile.jsx", content);
console.log("Done");
