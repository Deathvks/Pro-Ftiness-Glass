import sys

with open('frontend/src/components/CustomSelect.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add no-swipe class to the portal div
old_portal = '''      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: position.top !== undefined ? `${position.top}px` : 'auto',
        bottom: position.bottom !== undefined ? `${position.bottom}px` : 'auto',
        left: `${position.left}px`,
        minWidth: `${position.width}px`,
      }}
      className={`bg-bg-secondary border border-transparent dark:border dark:border-white/10 rounded-xl shadow-lg z-[9999] flex flex-col ${
        position.bottom !== undefined ? 'animate-[fade-in-down_0.2s_ease_out]' : 'animate-[fade-in-up_0.2s_ease_out]'
      }`}'''

new_portal = '''      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: position.top !== undefined ? `${position.top}px` : 'auto',
        bottom: position.bottom !== undefined ? `${position.bottom}px` : 'auto',
        left: `${position.left}px`,
        minWidth: `${position.width}px`,
      }}
      className={`no-swipe bg-bg-secondary border border-transparent dark:border dark:border-white/10 rounded-xl shadow-lg z-[9999] flex flex-col ${
        position.bottom !== undefined ? 'animate-[fade-in-down_0.2s_ease_out]' : 'animate-[fade-in-up_0.2s_ease_out]'
      }`}'''

content = content.replace(old_portal, new_portal)

with open('frontend/src/components/CustomSelect.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
