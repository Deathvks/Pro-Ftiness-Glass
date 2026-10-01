import sys
import re

with open('backend/controllers/chatController.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace resendBotReminder saving logic
old_save = '''    const lastMsg = await models.Message.findOne({ where: { receiver_id: prospect.id, bot_reminder_level: parsedLevel }, order: [['created_at', 'DESC']] });
    if (lastMsg) {
      if (type === 'push' || type === 'all') lastMsg.bot_push_status = status.push === 'ok' ? 'ok' : 'error';
      if (type === 'email' || type === 'all') lastMsg.bot_email_status = status.email === 'ok' ? 'ok' : 'error';
      await lastMsg.save();
    }'''

new_save = '''    const lastMsg = await models.Message.findOne({ where: { receiver_id: prospect.id, bot_reminder_level: parsedLevel }, order: [['created_at', 'DESC']] });
    if (lastMsg) {
      if (type === 'push' || type === 'all') lastMsg.bot_push_status = status.push === 'ok' ? 'manual_ok' : 'error';
      if (type === 'email' || type === 'all') lastMsg.bot_email_status = status.email === 'ok' ? 'manual_ok' : 'error';
      await lastMsg.save();
    }'''

content = content.replace(old_save, new_save)

with open('backend/controllers/chatController.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done backend save")
