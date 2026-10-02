import sys
import re

with open('mobile/src/app/register.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Verify code submit button
search_verify = """                  <TouchableOpacity 
                    style={[styles.loginButton, { backgroundColor: theme.tint, shadowColor: theme.tint, marginTop: 12, opacity: code.some(d => d === '') ? 0.7 : 1 }]}
                    onPress={handleVerifySubmit}
                    disabled={isLoading || code.some(d => d === '')}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#0f172a" />
                    ) : (
                      <Text style={styles.loginButtonText}>Verificar Código</Text>
                    )}
                  </TouchableOpacity>"""

replace_verify = """                  <GlassButton 
                    theme={colorScheme}
                    color={theme.tint}
                    style={[styles.loginButton, { marginTop: 12, opacity: code.some(d => d === '') ? 0.7 : 1 }]}
                    onPress={handleVerifySubmit}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={theme.textPrimary} />
                    ) : (
                      <Text style={[styles.loginButtonText, { color: theme.textPrimary }]}>Verificar Código</Text>
                    )}
                  </GlassButton>"""

# Since I don't know the exact spacing, I'll just use regex replacement or simpler replaces

# Register submit button
content = re.sub(
    r'<TouchableOpacity\s+style=\{\[styles\.loginButton,\s*\{\s*backgroundColor:\s*theme\.tint,\s*shadowColor:\s*theme\.tint\s*\}\]\}\s*onPress=\{handleRegisterSubmit\}\s*disabled=\{isLoading\}\s*>',
    r'<GlassButton\n                    theme={colorScheme}\n                    color={theme.tint}\n                    style={styles.loginButton}\n                    onPress={handleRegisterSubmit}\n                  >',
    content
)

content = content.replace("</TouchableOpacity>\n\n                  {/* DIVIDER */}", "</GlassButton>\n\n                  {/* DIVIDER */}")

# Let's fix the Verify code button if it's there
content = re.sub(
    r'<TouchableOpacity\s+style=\{\[styles\.loginButton,\s*\{\s*backgroundColor:\s*theme\.tint,\s*shadowColor:\s*theme\.tint,\s*marginTop:\s*12,\s*opacity:\s*code\.some\(d\s*=>\s*d\s*===\s*\'\'\)\s*\?\s*0\.7\s*:\s*1\s*\}\]\}\s*onPress=\{handleVerifySubmit\}\s*disabled=\{isLoading\s*\|\|\s*code\.some\(d\s*=>\s*d\s*===\s*\'\'\)\}\s*>',
    r'<GlassButton\n                    theme={colorScheme}\n                    color={theme.tint}\n                    style={[styles.loginButton, { marginTop: 12, opacity: code.some(d => d === \'\') ? 0.7 : 1 }]}\n                    onPress={handleVerifySubmit}\n                  >',
    content
)

content = content.replace("                  </TouchableOpacity>\n\n                  <View style={[styles.footer, { marginTop: 24, borderTopWidth: 0, paddingTop: 0 }]}>", "                  </GlassButton>\n\n                  <View style={[styles.footer, { marginTop: 24, borderTopWidth: 0, paddingTop: 0 }]}>")

with open('mobile/src/app/register.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated register.tsx")
