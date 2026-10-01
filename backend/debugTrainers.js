import db from './models/index.js';
const { User, Message } = db;
const users = await User.findAll({ where: { role: ['admin', 'trainer'] } });
console.log(users.map(u => `${u.id}: ${u.role}`).join(', '));
process.exit(0);
