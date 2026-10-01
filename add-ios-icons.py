import sys

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Group 1
old_g1 = '''        {/* Group 1: Datos Básicos */}
        <div className="mb-6">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-4">Datos Básicos</h2>
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
        </div>'''

new_g1 = '''        {/* Group 1: Datos Básicos */}
        <div className="mb-6">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-4">Datos Básicos</h2>
            <div className="bg-bg-secondary rounded-[24px] shadow-sm ring-1 ring-glass-border overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-glass-border">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-sm">
                            <User size={16} strokeWidth={2.5} />
                        </div>
                        <span className="text-[15px] font-medium text-text-primary">Usuario</span>
                    </div>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} className="text-right bg-transparent outline-none text-text-secondary font-medium w-1/2 min-w-[100px]" placeholder="Tu usuario" />
                </div>
                {errors.username && <p className="text-xs text-red font-bold px-4 pb-2 pt-1">{errors.username}</p>}

                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-sm">
                            <Mail size={16} strokeWidth={2.5} />
                        </div>
                        <span className="text-[15px] font-medium text-text-primary">Email</span>
                    </div>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="text-right bg-transparent outline-none text-text-secondary font-medium w-1/2 min-w-[100px]" placeholder="Tu email" />
                </div>
                {errors.email && <p className="text-xs text-red font-bold px-4 pb-2 pt-1">{errors.email}</p>}
            </div>
        </div>'''

content = content.replace(old_g1, new_g1)

# Group 2
old_g2 = '''        {/* Group 2: Seguridad */}
        <div className="mb-6">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-4">Seguridad</h2>
            <div className="bg-bg-secondary rounded-[24px] shadow-sm ring-1 ring-glass-border overflow-hidden">
                {hasPassword && (
                <div className="flex items-center justify-between p-4 border-b border-glass-border">
                    <span className="text-[15px] font-medium text-text-primary whitespace-nowrap mr-2">Contraseña actual</span>
                    <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} className="text-right bg-transparent outline-none text-text-secondary font-medium w-full min-w-0" placeholder="••••••" />
                </div>
                )}
                <div className="flex items-center justify-between p-4">
                    <span className="text-[15px] font-medium text-text-primary whitespace-nowrap mr-2">{hasPassword ? "Nueva contraseña" : "Crear contraseña"}</span>
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
                {hasPassword && (
                <div className="flex items-center justify-between p-4 border-b border-glass-border">
                    <div className="flex items-center gap-3 mr-2">
                        <div className="w-7 h-7 rounded-lg bg-gray-500 flex items-center justify-center text-white shadow-sm shrink-0">
                            <Lock size={16} strokeWidth={2.5} />
                        </div>
                        <span className="text-[15px] font-medium text-text-primary whitespace-nowrap">Contraseña actual</span>
                    </div>
                    <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} className="text-right bg-transparent outline-none text-text-secondary font-medium w-full min-w-0" placeholder="••••••" />
                </div>
                )}
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 mr-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm shrink-0">
                            <Key size={16} strokeWidth={2.5} />
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

content = content.replace(old_g2, new_g2)

# Group 3
old_g3 = '''        {/* Group 3: Mi Perfil Social & Progreso */}
        <div className="mb-6">
            <div className="bg-bg-secondary rounded-[24px] shadow-sm ring-1 ring-glass-border overflow-hidden">
                <button type="button" onClick={handleViewPublicProfile} className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">
                    <span className="text-[15px] font-medium text-text-primary">Ver mi perfil público</span>
                    <ChevronRight size={18} className="text-text-muted" />
                </button>
            </div>
        </div>'''

new_g3 = '''        {/* Group 3: Mi Perfil Social & Progreso */}
        <div className="mb-6">
            <div className="bg-bg-secondary rounded-[24px] shadow-sm ring-1 ring-glass-border overflow-hidden">
                <button type="button" onClick={handleViewPublicProfile} className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-sm shrink-0">
                            <Globe size={16} strokeWidth={2.5} />
                        </div>
                        <span className="text-[15px] font-medium text-text-primary">Ver mi perfil público</span>
                    </div>
                    <ChevronRight size={18} className="text-text-muted" />
                </button>
            </div>
        </div>'''

content = content.replace(old_g3, new_g3)

# Group 5
old_g5 = '''        {/* Group 5: Danger Zone */}
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
        </div>'''

new_g5 = '''        {/* Group 5: Danger Zone */}
        <div className="mb-10">
            <h2 className="text-xs font-bold text-red/60 uppercase tracking-wider mb-2 px-4">Zona de Peligro</h2>
            <div className="bg-bg-secondary rounded-[24px] shadow-sm ring-1 ring-glass-border overflow-hidden">
                <button type="button" onClick={() => setModalAction('deleteData')} className="w-full flex items-center justify-between p-4 border-b border-glass-border hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-sm shrink-0">
                            <Trash2 size={16} strokeWidth={2.5} />
                        </div>
                        <span className="text-[15px] font-medium text-orange-500">Borrar mi historial de datos</span>
                    </div>
                    <ChevronRight size={18} className="text-text-muted" />
                </button>
                <button type="button" onClick={() => setModalAction('deleteAccount')} className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-red flex items-center justify-center text-white shadow-sm shrink-0">
                            <AlertTriangle size={16} strokeWidth={2.5} />
                        </div>
                        <span className="text-[15px] font-medium text-red">Borrar cuenta definitivamente</span>
                    </div>
                    <ChevronRight size={18} className="text-text-muted" />
                </button>
            </div>
        </div>'''

content = content.replace(old_g5, new_g5)

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
