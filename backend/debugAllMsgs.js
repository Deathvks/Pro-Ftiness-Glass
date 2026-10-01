import db from './models/index.js';
const { Message } = db;
const msgs = await Message.findAll({ where: { receiver_id: 11 }, order: [['created_at', 'ASC']] });
msgs.forEach(m => console.log(`ID: ${m.id}, Lvl: ${m.bot_reminder_level}, Date: ${m.created_at.toISOString()}, Msg: ${m.content}`));
process.exit(0);
