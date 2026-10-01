import sys

with open('mobile/src/app/login.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "import { GlassButton } from" not in content:
    content = content.replace("import { BlurView } from 'expo-blur';", "import { BlurView } from 'expo-blur';\nimport { GlassButton } from '@/components/ui/GlassButton';")

# 2FA verify button
content = content.replace("""                  <TouchableOpacity 
                    style={[styles.loginButton, { backgroundColor: theme.tint, shadowColor: theme.tint, marginTop: 12, opacity: code.some(d => d === '') ? 0.7 : 1 }]}
                    onPress={handleVerifySubmit}
                    disabled={isLoading || code.some(d => d === '')}
                  >""", """                  <GlassButton 
                    theme={colorScheme}
                    color={theme.tint}
                    style={[styles.loginButton, { marginTop: 12, opacity: code.some(d => d === '') ? 0.7 : 1 }]}
                    onPress={handleVerifySubmit}
                  >""")

content = content.replace("""                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.loginButtonText}>Verificar Cdigo</Text>
                    )}
                  </TouchableOpacity>""", """                    {isLoading ? (
                      <ActivityIndicator color={theme.textPrimary} />
                    ) : (
                      <Text style={[styles.loginButtonText, { color: theme.textPrimary }]}>Verificar Cdigo</Text>
                    )}
                  </GlassButton>""")

# Login submit button
content = content.replace("""                  <TouchableOpacity 
                    style={[styles.loginButton, { backgroundColor: theme.tint, shadowColor: theme.tint }]}
                    onPress={handleLoginSubmit}
                    disabled={isLoading}
                  >""", """                  <GlassButton 
                    theme={colorScheme}
                    color={theme.tint}
                    style={styles.loginButton}
                    onPress={handleLoginSubmit}
                  >""")

content = content.replace("""                      {isLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.loginButtonText}>Iniciar Sesin</Text>
                        </>
                      )}
                  </TouchableOpacity>""", """                      {isLoading ? (
                        <ActivityIndicator color={theme.textPrimary} />
                      ) : (
                        <>
                          <Text style={[styles.loginButtonText, { color: theme.textPrimary }]}>Iniciar Sesin</Text>
                        </>
                      )}
                  </GlassButton>""")

with open('mobile/src/app/login.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated login.tsx")
