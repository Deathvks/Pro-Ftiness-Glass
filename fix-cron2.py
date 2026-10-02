import sys
import re

with open('backend/services/cronService.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find the checkChatBotReminders function
pattern = re.compile(r'(const checkChatBotReminders = \(\) => \{\s+cron\.schedule\(\'0 11 \* \* \*\', async \(\) => \{[\s\S]*?\n\s+)(\}\);\n\};)')
match = pattern.search(content)

if match:
    new_content = content[:match.start(2)] + "}, {\n      timezone: 'Europe/Madrid'\n    });\n};" + content[match.end(2):]
    with open('backend/services/cronService.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced checkChatBotReminders timezone")
else:
    print("Could not find checkChatBotReminders")

