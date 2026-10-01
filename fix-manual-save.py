import sys

with open('backend/controllers/chatController.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_manual = '''    newMessage.bot_push_status = status.push === 'ok' ? 'ok' : 'error';
    newMessage.bot_email_status = status.email === 'ok' ? 'ok' : 'error';
    await newMessage.save();'''

new_manual = '''    newMessage.bot_push_status = status.push === 'ok' ? 'manual_ok' : 'error';
    newMessage.bot_email_status = status.email === 'ok' ? 'manual_ok' : 'error';
    await newMessage.save();'''

content = content.replace(old_manual, new_manual)

with open('backend/controllers/chatController.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
