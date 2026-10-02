import sys
import re

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'\n\s*\n\s*\n', '\n', content)

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done format")
