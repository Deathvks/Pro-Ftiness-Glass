import sys

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix regex
old_regex = r"""valid: /[!@#$%^&*(),.?":{}|<>\-_+=\\[\\]\\/'`]/.test(newPassword)"""
new_regex = r"""valid: /[!@#$%^&*(),.?":{}|<>\-_+=\x5B\x5D\x2F\x5C'`]/.test(newPassword)"""
content = content.replace(old_regex, new_regex)

old_regex2 = r"""valid: /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/'`]/.test(newPassword)"""
content = content.replace(old_regex2, new_regex)

# Fix handleSubmit
old_handle = """  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setIsLoading(true);
    setError('');"""

new_handle = """  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      if (hasPassword && currentPassword.length === 0) {
        setError('Introduce tu contraseña actual para confirmar.');
      } else {
        setError('La nueva contraseña no cumple todos los requisitos.');
      }
      return;
    }
    setIsLoading(true);
    setError('');"""

content = content.replace(old_handle, new_handle)

# Fix button disabled state
old_button = """              <button
                type="submit"
                disabled={isLoading || !isValid}
                className="w-full py-4 bg-accent text-accent-contrast font-bold rounded-[16px] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20 flex items-center justify-center"
              >"""

new_button = """              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 font-bold rounded-[16px] active:scale-95 transition-all flex items-center justify-center shadow-lg ${!isValid ? 'bg-bg-secondary text-text-secondary border border-glass-border shadow-none' : 'bg-accent text-accent-contrast shadow-accent/20'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >"""

content = content.replace(old_button, new_button)

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Profile")

with open('frontend/src/pages/RegisterScreen.jsx', 'r', encoding='utf-8') as f:
    content_reg = f.read()

old_reg_regex = r"""valid: /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/'`]/.test(password)"""
new_reg_regex = r"""valid: /[!@#$%^&*(),.?":{}|<>\-_+=\x5B\x5D\x2F\x5C'`]/.test(password)"""
content_reg = content_reg.replace(old_reg_regex, new_reg_regex)

with open('frontend/src/pages/RegisterScreen.jsx', 'w', encoding='utf-8') as f:
    f.write(content_reg)
print("Done Register")
