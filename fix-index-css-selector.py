import sys

with open('frontend/src/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace the space with no space, and add main
old_str = """html.light-theme .accent-yellow { --text-accent: #a16207; }
html.light-theme .accent-lemonade { --text-accent: #a16207; }
html.light-theme .accent-mango { --text-accent: #c2410c; }
html.light-theme .accent-mint { --text-accent: #0f766e; }
html.light-theme .accent-peach { --text-accent: #c2410c; }
html.light-theme .accent-rose-water { --text-accent: #be123c; }
html.light-theme .accent-lavender { --text-accent: #6d28d9; }
html.light-theme .accent-baby-blue { --text-accent: #1d4ed8; }
html.light-theme .accent-sunset-pink { --text-accent: #be123c; }
html.light-theme .accent-pistachio { --text-accent: #4d7c0f; }
html.light-theme .accent-cherry-blossom { --text-accent: #be123c; }
html.light-theme .accent-sky { --text-accent: #0284c7; }"""

new_str = """html.light-theme.accent-yellow main { --text-accent: #a16207; }
html.light-theme.accent-lemonade main { --text-accent: #a16207; }
html.light-theme.accent-mango main { --text-accent: #c2410c; }
html.light-theme.accent-mint main { --text-accent: #0f766e; }
html.light-theme.accent-peach main { --text-accent: #c2410c; }
html.light-theme.accent-rose-water main { --text-accent: #be123c; }
html.light-theme.accent-lavender main { --text-accent: #6d28d9; }
html.light-theme.accent-baby-blue main { --text-accent: #1d4ed8; }
html.light-theme.accent-sunset-pink main { --text-accent: #be123c; }
html.light-theme.accent-pistachio main { --text-accent: #4d7c0f; }
html.light-theme.accent-cherry-blossom main { --text-accent: #be123c; }
html.light-theme.accent-sky main { --text-accent: #0284c7; }"""

content = content.replace(old_str, new_str)

with open('frontend/src/index.css', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing index.css")
