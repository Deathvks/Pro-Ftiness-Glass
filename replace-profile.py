import sys

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "  return (\n    <>\n      <Helmet>"
if start_marker not in content:
    start_marker = "  return (\r\n    <>\r\n      <Helmet>"

end_marker = "// --- Componente: Modal de Recorte ---"

if start_marker not in content or end_marker not in content:
    print("Markers not found!")
    sys.exit(1)

start_index = content.index(start_marker)
end_index = content.index(end_marker)

new_jsx = """  return (
    <>
      <Helmet>
        <title>{Editar Perfil: \ - Pro Fitness Glass}</title>
      </Helmet>

      <div className="w-full max-w-2xl mx-auto px-4 pb-28 sm:p-6 lg:p-10 animate-[fade-in_0.3s_ease-out] mt-2 sm:mt-0">
        
        {/* Header - Avatar */}
        <div className="flex flex-col items-center mt-6 mb-8">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
            <div
              className="relative w-28 h-28 rounded-full cursor-pointer group shadow-md bg-bg-secondary ring-1 ring-glass-border p-1"
              onClick={openImageModal}
            >
              {imagePreview ? (
                <img
                  src={getProcessedImageUrl(imagePreview)}
                  alt="Foto de perfil"
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.target.onerror = null; }}
                />
              ) : (
                <div className="w-full h-full rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <User size={48} className="text-text-muted" strokeWidth={1.5} />
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current.click();
                }}
                className="absolute bottom-0 right-0 p-2.5 bg-accent rounded-full text-accent-contrast shadow-lg shadow-accent/40 group-hover:scale-110 transition-transform"
              >
                <Camera size={18} strokeWidth={2.5} />
              </button>
            </div>
            <h1 className="text-2xl font-bold mt-4 text-text-primary">{userProfile.username || 'Usuario'}</h1>
            <p className="text-sm text-text-secondary">{userProfile.email}</p>
        </div>

        {/* Group 1: Datos Bsicos */}
        <div className="mb-6">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-4">Datos Bsicos</h2>
            <div className="bg-bg-secondary rounded-[24px] shadow-sm ring-1 ring-glass-border overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-glass-border">
                    <span className="text-[15px] font-medium text-text-primary">Usuario</span>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} className="text-right bg-transparent outline-none text-text-secondary font-medium w-1/2 min-w-[100px]" placeholder="Tu usuario" />
                </div>
                {errors.username && <p className="text-xs text-red font-bold px-4 pb-2 pt-1">{errors.username}</p>}

                <div className="flex items-center justify-between p-4">
                    <span className="text-[15px] font-medium text-text-primary">Email</span>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="text-right bg-transparent outline-none text-text-secondary font-medium w-1/2 min-w-[100px]" placeholder="Tu email" />
                </div>
                {errors.email && <p className="text-xs text-red font-bold px-4 pb-2 pt-1">{errors.email}</p>}
            </div>
        </div>

        {/* Group 2: Seguridad */}
        <div className="mb-6">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-4">Seguridad</h2>
            <div className="bg-bg-secondary rounded-[24px] shadow-sm ring-1 ring-glass-border overflow-hidden">
                {hasPassword && (
                <div className="flex items-center justify-between p-4 border-b border-glass-border">
                    <span className="text-[15px] font-medium text-text-primary whitespace-nowrap mr-2">Contrasea actual</span>
                    <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} className="text-right bg-transparent outline-none text-text-secondary font-medium w-full min-w-0" placeholder="••••••" />
                </div>
                )}
                <div className="flex items-center justify-between p-4">
                    <span className="text-[15px] font-medium text-text-primary whitespace-nowrap mr-2">{hasPassword ? "Nueva contrasea" : "Crear contrasea"}</span>
                    <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} className="text-right bg-transparent outline-none text-text-secondary font-medium w-full min-w-0" placeholder="••••••" />
                </div>
                {(errors.currentPassword || errors.newPassword) && (
                    <div className="px-4 pb-3">
                        {errors.currentPassword && <p className="text-xs text-red font-bold">{errors.currentPassword}</p>}
                        {errors.newPassword && <p className="text-xs text-red font-bold">{errors.newPassword}</p>}
                    </div>
                )}
            </div>
        </div>

        {/* Action Button */}
        {isDirty && (
            <button
                onClick={(e) => handleSave(e)}
                disabled={isLoading}
                className="w-full bg-accent text-accent-contrast font-bold text-[15px] py-4 rounded-[20px] shadow-lg shadow-accent/20 mb-8 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                {isLoading ? <Spinner size={20} color="white" /> : <><Save size={18} strokeWidth={2.5}/> Guardar Cambios</>}
            </button>
        )}

        {/* Group 3: Mi Perfil Social & Progreso */}
        <div className="mb-6">
            <div className="bg-bg-secondary rounded-[24px] shadow-sm ring-1 ring-glass-border overflow-hidden">
                <button type="button" onClick={handleViewPublicProfile} className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-500/10 rounded-[10px] text-blue-500">
                            <Eye size={18} strokeWidth={2.5} />
                        </div>
                        <span className="text-[15px] font-medium text-text-primary">Ver mi perfil pblico</span>
                    </div>
                    <ChevronRight size={18} className="text-text-muted" />
                </button>
            </div>
        </div>

        {/* Group 4: Badges */}
        <div className="mb-8">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-4">Mis Insignias</h2>
            {gamification?.unlockedBadges?.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                    {gamification.unlockedBadges.slice(0, 6).map((badgeId) => {
                        const badge = BADGE_DETAILS[badgeId] || BADGE_DETAILS.default;
                        return (
                            <div key={badgeId} className="flex flex-col items-center p-3 rounded-[20px] bg-bg-secondary ring-1 ring-glass-border shadow-sm text-center">
                                <div className={w-10 h-10 rounded-[14px] flex items-center justify-center mb-2 \ \}>
                                    <badge.icon size={20} strokeWidth={2} />
                                </div>
                                <span className="text-[10px] font-bold text-text-primary leading-tight">{badge.name}</span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-bg-secondary rounded-[24px] p-6 ring-1 ring-glass-border text-center">
                    <Trophy size={24} className="text-text-muted mx-auto mb-2" />
                    <p className="text-sm text-text-secondary">An no tienes insignias.</p>
                </div>
            )}
        </div>

        {/* Group 5: Danger Zone */}
        <div className="mb-10">
            <h2 className="text-xs font-bold text-red/60 uppercase tracking-wider mb-2 px-4">Zona de Peligro</h2>
            <div className="bg-bg-secondary rounded-[24px] shadow-sm ring-1 ring-glass-border overflow-hidden">
                <button type="button" onClick={() => setModalAction('deleteData')} className="w-full flex items-center justify-between p-4 border-b border-glass-border hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">
                    <span className="text-[15px] font-medium text-orange-500">Borrar mi historial de datos</span>
                    <ChevronRight size={18} className="text-text-muted" />
                </button>
                <button type="button" onClick={() => setModalAction('deleteAccount')} className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">
                    <span className="text-[15px] font-medium text-red">Borrar cuenta definitivamente</span>
                    <ChevronRight size={18} className="text-text-muted" />
                </button>
            </div>
        </div>

      </div>

      {isImageModalOpen && (
        <ProfileImageModal
          imageUrl={getProcessedImageUrl(imagePreview)}
          username={formData.username}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}

      {isCropping && tempImage && (
        <ImageCropModal
          imageSrc={tempImage}
          onComplete={handleCropComplete}
          onCancel={() => {
            setIsCropping(false);
            setTempImage(null);
          }}
        />
      )}

      <DeleteConfirmationModal
        modalAction={modalAction}
        isModalLoading={isModalLoading}
        modalPassword={modalPassword}
        setModalPassword={setModalPassword}
        modalError={modalError}
        setModalError={setModalError}
        handleModalClose={handleModalClose}
        handleModalConfirm={handleModalConfirm}
        baseInputClasses={baseInputClasses}
        hasPassword={hasPassword}
      />

      <AnimatePresence>
        {showUnsavedModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowUnsavedModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm"
            >
              <div className="bg-bg-secondary p-6 rounded-[28px] ring-1 ring-glass-border shadow-2xl flex flex-col gap-6">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-[20px] bg-accent/10 flex items-center justify-center text-accent ring-1 ring-accent/30">
                    <AlertTriangle size={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">Cambios sin guardar</h3>
                    <p className="text-sm text-text-secondary font-medium">
                      Tienes cambios pendientes. Quieres aplicarlos ahora o salir sin guardar?
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setShowUnsavedModal(false);
                      handleSave({ preventDefault: () => {} });
                    }}
                    className="w-full py-4 rounded-[16px] font-bold bg-accent text-accent-contrast hover:brightness-110 transition-all active:scale-95"
                  >
                    Guardar y salir
                  </button>
                  <button
                    onClick={() => {
                      setShowUnsavedModal(false);
                      onCancel();
                    }}
                    className="w-full py-4 rounded-[16px] font-bold bg-black/5 dark:bg-white/5 text-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95"
                  >
                    Salir sin guardar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

"""

final_content = content[:start_index] + new_jsx + content[end_index:]

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(final_content)

print("Done")
