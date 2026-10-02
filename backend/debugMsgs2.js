import db from './models/index.js';
const { Message } = db;
const msgs = await Message.findAll({ where: { attachment_type: 'bot_reply' } });
msgs.forEach(m => console.log(`ID: ${m.id}, Level: ${m.bot_reminder_level}, Date: ${m.created_at.toISOString()}, Receiver: ${m.receiver_id}`));
process.exit(0);
