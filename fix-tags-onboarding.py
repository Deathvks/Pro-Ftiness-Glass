import sys
import re

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix BigOptionButton closing tag
content = content.replace("      </BlurView>\n    </TouchableOpacity>\n  );", "    </GlassButton>\n  );")

# Wait, let's make sure there isn't another missing tag for Gender button
# The gender button opening was replaced with GlassButton. Let's see if its closing was fixed.
content = content.replace("                  </BlurView>\n              </TouchableOpacity>", "              </GlassButton>")

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed closing tags in onboarding")
