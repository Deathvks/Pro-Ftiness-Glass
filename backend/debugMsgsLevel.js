import db from './models/index.js';
import { Op } from 'sequelize';
const { Message } = db;
const msgs = await Message.findAll({ where: { bot_reminder_level: { [Op.gt]: 0 } } });
console.log(`Total bot messages: ${msgs.length}`);
msgs.forEach(m => console.log(`ID: ${m.id}, Lvl: ${m.bot_reminder_level}, Receiver: ${m.receiver_id}, Date: ${m.created_at.toISOString()}`));
process.exit(0);
