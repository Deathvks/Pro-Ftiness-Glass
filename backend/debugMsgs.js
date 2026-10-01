import db from './models/index.js';

const debugMsgs = async () => {
    try {
        const { Message } = db;
        const msgs = await Message.findAll({
            where: { receiver_id: 11, sender_id: 1 },
            order: [['created_at', 'DESC']],
            limit: 5
        });
        msgs.forEach(m => console.log(`ID: ${m.id}, Level: ${m.bot_reminder_level}, Date: ${m.created_at.toISOString()}, Type: ${m.attachment_type}`));
    } catch (e) { console.error(e); }
    process.exit(0);
}
debugMsgs();
