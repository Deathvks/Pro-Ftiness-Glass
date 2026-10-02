import db from './models/index.js';
import { Op } from 'sequelize';
const { User, Message } = db;
const users = await User.findAll({ where: { role: 'user' } });
for (const u of users) {
    const msgs = await Message.findAll({ where: { receiver_id: u.id, bot_reminder_level: { [Op.gt]: 0 } } });
    if (msgs.length > 0) {
        console.log(`User ${u.id} (${u.email}) has ${msgs.length} bot messages. Levels: ${msgs.map(m => m.bot_reminder_level).join(', ')}`);
    }
}
process.exit(0);
