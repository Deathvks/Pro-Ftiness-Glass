import db from './models/index.js';
const { User, Message } = db;
const admins = await User.findAll({ where: { role: 'admin' } });
console.log("Admins:", admins.map(a => a.id).join(', '));
const msgs = await Message.findAll({ where: { content: { [db.Sequelize.Op.like]: '%Si no recibo respuesta en 1 d%a%' } }, order: [['created_at', 'DESC']], limit: 5 });
msgs.forEach(m => console.log(`Msg ${m.id} | Receiver: ${m.receiver_id} | Sender: ${m.sender_id} | Date: ${m.created_at}`));
process.exit(0);
