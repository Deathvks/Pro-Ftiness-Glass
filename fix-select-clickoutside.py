import sys
import re

with open('frontend/src/components/CustomSelect.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the whole useEffect for click outside
click_effect = re.compile(r'useEffect\(\(\) => \{\s*const handleClickOutside.*?\}, \[\]\);\s*', re.DOTALL)
content = click_effect.sub('', content)

with open('frontend/src/components/CustomSelect.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done removing click outside")
