import db from './models/index.js';
const { Message } = db;
const m = await Message.findOne({ where: { attachment_type: 'bot_reply', receiver_id: 11 } });
console.log(`Push: ${m.bot_push_status}, Email: ${m.bot_email_status}`);
process.exit(0);
