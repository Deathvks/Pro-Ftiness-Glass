import sys
import re

with open('frontend/src/components/CustomSelect.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace const DropdownPortal = () => createPortal( \n <div
pattern = re.compile(r'const DropdownPortal = \(\) => createPortal\(\s*<div', re.DOTALL)
new_portal = '''const DropdownPortal = () => createPortal(
    <>
      <div 
        className="fixed inset-0 z-[9998]" 
        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
        onTouchStart={(e) => { e.stopPropagation(); setIsOpen(false); }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}'''

content = pattern.sub(new_portal, content)

# Replace document.body
content = content.replace("</div>,\n    document.body", "</div>\n    </>,\n    document.body")
content = content.replace("</div>,\r\n    document.body", "</div>\n    </>,\n    document.body")

with open('frontend/src/components/CustomSelect.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done backdrop regex")
