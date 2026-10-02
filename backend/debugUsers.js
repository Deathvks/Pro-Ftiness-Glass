import db from './models/index.js';
const { User, Message } = db;
const users = await User.findAll();
console.log(users.map(u => `${u.id}: ${u.email} (${u.role})`).join('\n'));
process.exit(0);
