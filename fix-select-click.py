import sys
import re

with open('frontend/src/components/CustomSelect.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace mousedown with mousedown and touchstart
content = content.replace(
    "document.addEventListener('mousedown', handleClickOutside);",
    "document.addEventListener('mousedown', handleClickOutside);\n      document.addEventListener('touchstart', handleClickOutside, { passive: true });"
)
content = content.replace(
    "return () => document.removeEventListener('mousedown', handleClickOutside);",
    "return () => {\n        document.removeEventListener('mousedown', handleClickOutside);\n        document.removeEventListener('touchstart', handleClickOutside);\n      };"
)

with open('frontend/src/components/CustomSelect.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
