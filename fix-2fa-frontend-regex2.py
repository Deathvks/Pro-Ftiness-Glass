import re

with open('frontend/src/pages/LoginScreen.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'(token:\s*twoFactorPending\.method === \'app\' \? verificationCode : undefined,\s*code:\s*twoFactorPending\.method === \'email\' \? verificationCode : undefined,)',
    r'\1\n                rememberMe: twoFactorPending.rememberMe,',
    content
)

with open('frontend/src/pages/LoginScreen.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed LoginScreen")
