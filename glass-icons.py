import sys

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Group 1 User
content = content.replace(
    '''<div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-sm">
                            <User size={16} strokeWidth={2.5} />
                        </div>''',
    '''<div className="w-8 h-8 rounded-[12px] bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-secondary ring-1 ring-glass-border shadow-sm shrink-0 group-hover:bg-accent/10 group-hover:text-accent group-hover:ring-accent/30 transition-colors">
                            <UserCircle size={18} strokeWidth={2} />
                        </div>'''
)

# Replace Group 1 Email
content = content.replace(
    '''<div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-sm">
                            <Mail size={16} strokeWidth={2.5} />
                        </div>''',
    '''<div className="w-8 h-8 rounded-[12px] bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-secondary ring-1 ring-glass-border shadow-sm shrink-0 group-hover:bg-accent/10 group-hover:text-accent group-hover:ring-accent/30 transition-colors">
                            <AtSign size={18} strokeWidth={2} />
                        </div>'''
)

# Replace Group 2 Current Password
content = content.replace(
    '''<div className="w-7 h-7 rounded-lg bg-gray-500 flex items-center justify-center text-white shadow-sm shrink-0">
                            <Lock size={16} strokeWidth={2.5} />
                        </div>''',
    '''<div className="w-8 h-8 rounded-[12px] bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-secondary ring-1 ring-glass-border shadow-sm shrink-0 group-hover:bg-accent/10 group-hover:text-accent group-hover:ring-accent/30 transition-colors">
                            <Shield size={18} strokeWidth={2} />
                        </div>'''
)

# Replace Group 2 New Password
content = content.replace(
    '''<div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm shrink-0">
                            <Key size={16} strokeWidth={2.5} />
                        </div>''',
    '''<div className="w-8 h-8 rounded-[12px] bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-secondary ring-1 ring-glass-border shadow-sm shrink-0 group-hover:bg-accent/10 group-hover:text-accent group-hover:ring-accent/30 transition-colors">
                            <Key size={18} strokeWidth={2} />
                        </div>'''
)

# Replace Group 3 Public Profile
content = content.replace(
    '''<div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-sm shrink-0">
                            <Globe size={16} strokeWidth={2.5} />
                        </div>''',
    '''<div className="w-8 h-8 rounded-[12px] bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-secondary ring-1 ring-glass-border shadow-sm shrink-0 group-hover:bg-accent/10 group-hover:text-accent group-hover:ring-accent/30 transition-colors">
                            <LayoutTemplate size={18} strokeWidth={2} />
                        </div>'''
)

# Replace Group 5 Danger 1
content = content.replace(
    '''<div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-sm shrink-0">
                            <Trash2 size={16} strokeWidth={2.5} />
                        </div>''',
    '''<div className="w-8 h-8 rounded-[12px] bg-orange-500/10 flex items-center justify-center text-orange-500 ring-1 ring-orange-500/30 shadow-sm shrink-0 group-hover:bg-orange-500/20 transition-colors">
                            <Trash2 size={18} strokeWidth={2} />
                        </div>'''
)

# Replace Group 5 Danger 2
content = content.replace(
    '''<div className="w-7 h-7 rounded-lg bg-red flex items-center justify-center text-white shadow-sm shrink-0">
                            <AlertTriangle size={16} strokeWidth={2.5} />
                        </div>''',
    '''<div className="w-8 h-8 rounded-[12px] bg-red/10 flex items-center justify-center text-red ring-1 ring-red/30 shadow-sm shrink-0 group-hover:bg-red/20 transition-colors">
                            <AlertTriangle size={18} strokeWidth={2} />
                        </div>'''
)

# Oh wait, to make group-hover work, I need to add group to the container row!
content = content.replace(
    '''<div className="flex items-center justify-between p-4 border-b border-glass-border">''',
    '''<div className="group flex items-center justify-between p-4 border-b border-glass-border">'''
)
content = content.replace(
    '''<div className="flex items-center justify-between p-4">''',
    '''<div className="group flex items-center justify-between p-4">'''
)
# For the buttons (Ver mi perfil, Borrar historial), add group
content = content.replace(
    '''<button type="button" onClick={handleViewPublicProfile} className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">''',
    '''<button type="button" onClick={handleViewPublicProfile} className="group w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">'''
)
content = content.replace(
    '''<button type="button" onClick={() => setModalAction('deleteData')} className="w-full flex items-center justify-between p-4 border-b border-glass-border hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">''',
    '''<button type="button" onClick={() => setModalAction('deleteData')} className="group w-full flex items-center justify-between p-4 border-b border-glass-border hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">'''
)
content = content.replace(
    '''<button type="button" onClick={() => setModalAction('deleteAccount')} className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">''',
    '''<button type="button" onClick={() => setModalAction('deleteAccount')} className="group w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">'''
)

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
