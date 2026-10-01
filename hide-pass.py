import sys
import re

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We want to wrap the Change Password button in {hasPassword && ( ... )}
# Let's find the button block
pattern = re.compile(r'(<button type="button" onClick=\{\(\) => setShowPasswordModal\(true\)\}.*?</button>)', re.DOTALL)

replacement = r'{hasPassword && (\n\1\n)}'
new_content = pattern.sub(replacement, content)

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done")
