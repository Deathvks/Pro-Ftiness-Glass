import sys
import re

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to find the motion.div inside ChangePasswordModal and replace it.
# Let's target the exact text
pattern = re.compile(r'<motion\.div\s*initial=\{\{\s*y:\s*"100%"\s*\}\}\s*animate=\{\{\s*y:\s*0\s*\}\}\s*exit=\{\{\s*y:\s*"100%"\s*\}\}\s*transition=\{\{\s*type:\s*"spring",\s*damping:\s*25,\s*stiffness:\s*200\s*\}\}\s*className="relative w-full max-w-md bg-bg-secondary sm:rounded-\[24px\] rounded-t-\[32px\] p-6 pb-\[calc\(max\(env\(safe-area-inset-bottom,0px\),24px\)\)\] shadow-2xl sm:border border-t border-glass-border overflow-hidden flex flex-col"\s*style=\{\{.*?\}\}\s*onTouchStart=\{.*?\}\s*onTouchMove=\{.*?\}\s*onTouchEnd=\{.*?\}\s*>', re.DOTALL)

new_div = '''<motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md bg-bg-secondary sm:rounded-[24px] rounded-t-[32px] p-6 pb-[calc(max(env(safe-area-inset-bottom,0px),24px))] shadow-2xl sm:border border-t border-glass-border overflow-hidden flex flex-col"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 1 }}
        onDragEnd={(e, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) onClose();
        }}
      >'''

content = pattern.sub(new_div, content)

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done motion div")
