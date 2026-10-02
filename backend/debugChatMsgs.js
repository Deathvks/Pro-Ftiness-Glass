import db from './models/index.js';
const { Message } = db;
const msgs = await Message.findAll({ where: { receiver_id: 1 } });
console.log(msgs.map(m => `From ${m.sender_id}: ${m.content} (Level: ${m.bot_reminder_level}) - Date: ${m.created_at.toISOString()}`).join('\n'));
process.exit(0);
