import sys

with open('frontend/src/components/CustomSelect.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the whole useEffect for click outside
import re
click_effect = re.compile(r'useEffect\(\(\) => \{\s*const handleClickOutside.*?\}, \[\]\);\s*', re.DOTALL)
content = click_effect.sub('', content)

# Add backdrop before the dropdown
old_portal = '''    const DropdownPortal = () => createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: 'fixed',
          top: position.top,
          bottom: position.bottom,
          left: position.left,
          width: position.width,
        }}
        className={`bg-bg-secondary border border-transparent dark:border dark:border-white/10 rounded-xl shadow-lg z-[9999] flex flex-col ${
          position.bottom !== undefined ? 'animate-[fade-in-down_0.2s_ease_out]' : 'animate-[fade-in-up_0.2s_ease_out]'
        }`}
      >'''

new_portal = '''    const DropdownPortal = () => createPortal(
      <>
        <div 
          className="fixed inset-0 z-[9998]" 
          onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
          onTouchStart={(e) => { e.stopPropagation(); setIsOpen(false); }}
        />
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: position.top,
            bottom: position.bottom,
            left: position.left,
            width: position.width,
          }}
          className={`bg-bg-secondary border border-transparent dark:border dark:border-white/10 rounded-xl shadow-lg z-[9999] flex flex-col ${
            position.bottom !== undefined ? 'animate-[fade-in-down_0.2s_ease_out]' : 'animate-[fade-in-up_0.2s_ease_out]'
          }`}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >'''

content = content.replace(old_portal, new_portal)

# Add fragment end
old_portal_end = '''      </div>,
      document.body
    );'''

new_portal_end = '''      </div>
      </>,
      document.body
    );'''

content = content.replace(old_portal_end, new_portal_end)

with open('frontend/src/components/CustomSelect.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done CustomSelect backdrop")
