import sys

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Header - Avatar
old_header = '''        {/* Header - Avatar */}
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
        </div>'''

new_header = '''        {/* Header - Avatar */}
        <div className="flex flex-col items-center mt-6 mb-8">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
            <div
              className="relative w-24 h-24 rounded-full cursor-pointer overflow-hidden shadow-sm ring-1 ring-glass-border mb-3"
              onClick={openImageModal}
            >
              {imagePreview ? (
                <img
                  src={getProcessedImageUrl(imagePreview)}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.target.onerror = null; }}
                />
              ) : (
                <div className="w-full h-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <User size={40} className="text-text-muted opacity-50" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="text-[15px] font-bold text-accent active:opacity-50 transition-opacity mb-4"
            >
                Editar foto
            </button>
            <h1 className="text-2xl font-bold text-text-primary">{userProfile.username || 'Usuario'}</h1>
            <p className="text-sm text-text-secondary">{userProfile.email}</p>
        </div>'''

content = content.replace(old_header, new_header)

# 2. Action Button
old_action = '''        {/* Action Button */}
        {isDirty && (
            <button
                onClick={(e) => handleSave(e)}
                disabled={isLoading}
                className="w-full bg-accent text-accent-contrast font-bold text-[15px] py-4 rounded-[20px] shadow-lg shadow-accent/20 mb-8 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                {isLoading ? <Spinner size={20} color="white" /> : <><Save size={18} strokeWidth={2.5}/> Guardar Cambios</>}
            </button>
        )}'''

new_action = '''        {/* Action Button */}
        {isDirty && (
            <button
                onClick={(e) => handleSave(e)}
                disabled={isLoading}
                className="w-full bg-accent text-accent-contrast font-bold text-[15px] py-4 rounded-[20px] shadow-lg shadow-accent/20 mb-8 active:scale-95 transition-all flex items-center justify-center"
            >
                {isLoading ? <Spinner size={20} color="white" /> : "Guardar Cambios"}
            </button>
        )}'''

content = content.replace(old_action, new_action)

# 3. Group 3
old_group3 = '''        {/* Group 3: Mi Perfil Social & Progreso */}
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
        </div>'''

new_group3 = '''        {/* Group 3: Mi Perfil Social & Progreso */}
        <div className="mb-6">
            <div className="bg-bg-secondary rounded-[24px] shadow-sm ring-1 ring-glass-border overflow-hidden">
                <button type="button" onClick={handleViewPublicProfile} className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">
                    <span className="text-[15px] font-medium text-text-primary">Ver mi perfil público</span>
                    <ChevronRight size={18} className="text-text-muted" />
                </button>
            </div>
        </div>'''

content = content.replace(old_group3, new_group3)

# 4. Group 4 accents
content = content.replace("An no tienes insignias.", "Aún no tienes insignias.")
content = content.replace("Datos Bsicos", "Datos Básicos")
content = content.replace("Contrasea actual", "Contraseña actual")
content = content.replace("Nueva contrasea", "Nueva contraseña")
content = content.replace("Crear contrasea", "Crear contraseña")

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
