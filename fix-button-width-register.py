import sys
import re

with open('mobile/src/app/register.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("  loginButton: {\n    flexDirection: 'row',\n    height: 52,", 
                          "  loginButton: {\n    flexDirection: 'row',\n    width: '100%',\n    height: 52,")

with open('mobile/src/app/register.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Added width: '100%' to register.tsx")
