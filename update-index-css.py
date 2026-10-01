import sys
import re

with open('frontend/src/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

# For every line like: html.light-theme.accent-yellow main { --text-accent: #a16207; }
# Change to: html.light-theme.accent-yellow main, html.light-theme.accent-yellow .auth-container { --text-accent: #a16207; }

def replace_rule(match):
    prefix = match.group(1)
    color = match.group(2)
    return f"{prefix} main, {prefix} .auth-container {{ --text-accent: {color}; }}"

content = re.sub(r'(html\.light-theme\.accent-[a-z-]+) main \{ --text-accent: (#[a-fA-F0-9]+); \}', replace_rule, content)

with open('frontend/src/index.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated index.css with .auth-container")
