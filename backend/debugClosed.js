import db from './models/index.js';
const { Message } = db;
const msgs = await Message.findAll({ where: { is_closed: true } });
console.log(`Closed chats: ${msgs.length}`);
process.exit(0);
