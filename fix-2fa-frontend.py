import sys

# 1. Update authSlice.js
with open('frontend/src/store/authSlice.js', 'r', encoding='utf-8') as f:
    content = f.read()

search_str = """                    userId: response.userId,
                    method: response.method,
                    email: credentials.email // til para mostrar "enviado a..."
                }"""
replace_str = """                    userId: response.userId,
                    method: response.method,
                    email: credentials.email, // til para mostrar "enviado a..."
                    rememberMe: credentials.rememberMe
                }"""
content = content.replace(search_str, replace_str)
with open('frontend/src/store/authSlice.js', 'w', encoding='utf-8') as f:
    f.write(content)

# 2. Update LoginScreen.jsx
with open('frontend/src/pages/LoginScreen.jsx', 'r', encoding='utf-8') as f:
    content2 = f.read()

search_str2 = """                userId: twoFactorPending.userId,
                token: twoFactorPending.method === 'app' ? verificationCode : undefined,
                code: twoFactorPending.method === 'email' ? verificationCode : undefined,
            };"""
replace_str2 = """                userId: twoFactorPending.userId,
                token: twoFactorPending.method === 'app' ? verificationCode : undefined,
                code: twoFactorPending.method === 'email' ? verificationCode : undefined,
                rememberMe: twoFactorPending.rememberMe,
            };"""
content2 = content2.replace(search_str2, replace_str2)
with open('frontend/src/pages/LoginScreen.jsx', 'w', encoding='utf-8') as f:
    f.write(content2)

print("Done updating 2FA rememberMe propagation")
