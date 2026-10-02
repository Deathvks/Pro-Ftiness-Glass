import re

with open('frontend/src/store/authSlice.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'(userId:\s*response\.userId,\s*method:\s*response\.method,\s*email:\s*credentials\.email[^\n]*)',
    r'\1,\n                    rememberMe: credentials.rememberMe',
    content
)

with open('frontend/src/store/authSlice.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed authSlice")
