import sys
import re

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("                </BlurView>\n              </TouchableOpacity>", "              </GlassButton>")

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed gender closing tag")
