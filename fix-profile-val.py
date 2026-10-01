import sys

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

search_str = "const isValid = reqs.every(r => r.valid) && (!hasPassword || currentPassword.length > 0);"
replace_str = "const isValid = reqs.every(r => r.valid) && (!hasPassword || currentPassword.length > 0) && newPassword === confirmNewPassword;"

content = content.replace(search_str, replace_str)

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing Profile.jsx validation")
