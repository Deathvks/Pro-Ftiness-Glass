import sys

with open('mobile/src/app/register.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "import { GlassButton } from" not in content:
    content = content.replace("import { BlurView } from 'expo-blur';", "import { BlurView } from 'expo-blur';\nimport { GlassButton } from '@/components/ui/GlassButton';")

content = content.replace("""                  <TouchableOpacity 
                    style={[styles.loginButton, { backgroundColor: theme.tint, shadowColor: theme.tint, marginTop: 12 }]}
                    onPress={handleRegisterSubmit}
                    disabled={isLoading}
                  >""", """                  <GlassButton 
                    theme={colorScheme}
                    color={theme.tint}
                    style={[styles.loginButton, { marginTop: 12 }]}
                    onPress={handleRegisterSubmit}
                  >""")

content = content.replace("""                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.loginButtonText}>Crear Cuenta</Text>
                    )}
                  </TouchableOpacity>""", """                    {isLoading ? (
                      <ActivityIndicator color={theme.textPrimary} />
                    ) : (
                      <Text style={[styles.loginButtonText, { color: theme.textPrimary }]}>Crear Cuenta</Text>
                    )}
                  </GlassButton>""")

with open('mobile/src/app/register.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated register.tsx")
