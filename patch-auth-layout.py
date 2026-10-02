import sys

def patch_file(filepath, old_str, new_str):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    if old_str in content:
        content = content.replace(old_str, new_str)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {filepath}")
    else:
        print(f"Could not find target string in {filepath}")

patch_file('frontend/src/pages/LoginScreen.jsx', 
           '<div className="flex flex-col lg:flex-row w-full h-[100dvh] bg-bg-primary overflow-hidden">', 
           '<div className="auth-container flex flex-col lg:flex-row w-full h-[100dvh] bg-bg-primary overflow-hidden">')

patch_file('frontend/src/pages/RegisterScreen.jsx', 
           '<div className="flex flex-col lg:flex-row w-full h-[100dvh] bg-bg-primary overflow-hidden">', 
           '<div className="auth-container flex flex-col lg:flex-row w-full h-[100dvh] bg-bg-primary overflow-hidden">')

patch_file('frontend/src/pages/ForgotPasswordScreen.jsx', 
           '<div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4 animate-[fade-in_0.5s_ease-out]">', 
           '<div className="auth-container flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4 animate-[fade-in_0.5s_ease-out]">')

patch_file('frontend/src/pages/ResetPasswordScreen.jsx', 
           '<div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4 animate-[fade-in_0.5s_ease-out]">', 
           '<div className="auth-container flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4 animate-[fade-in_0.5s_ease-out]">')
