import sys

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Make email readonly / a text span
old_email = '''<input type="email" name="email" value={formData.email} onChange={handleChange} className="text-right bg-transparent outline-none text-text-secondary font-medium flex-1 ml-4 min-w-0 truncate" placeholder="Tu email" />'''
new_email = '''<span className="text-right text-text-secondary font-medium flex-1 ml-4 min-w-0 truncate">{userProfile.email}</span>'''
content = content.replace(old_email, new_email)

# 2. Fix the Password Modal FPS and requirements
# First, remove manual drag state
content = content.replace("const [dragY, setDragY] = useState(0);\n  const [touchStartY, setTouchStartY] = useState(null);\n", "")

# Update the motion.div to use native framer motion drag
old_modal_div = '''      <motion.div 
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
      >'''

new_modal_div = '''      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md bg-bg-secondary sm:rounded-[24px] rounded-t-[32px] p-6 pb-[calc(max(env(safe-area-inset-bottom,0px),24px))] shadow-2xl sm:border border-t border-glass-border overflow-hidden flex flex-col"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 1 }}
        onDragEnd={(e, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) onClose();
        }}
      >'''
content = content.replace(old_modal_div, new_modal_div)

# 3. Always show requirements in Password Modal (remove {newPassword.length > 0 && (...)})
old_reqs = '''          {newPassword.length > 0 && (
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
          )}'''

new_reqs = '''          <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-2 px-2">
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
          </div>'''
content = content.replace(old_reqs, new_reqs)

# Also fix the weird powershell string for reqs class just in case:
# Ensure it hasn't broken.

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done Profile")
