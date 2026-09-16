import models from './models/index.js';
import { Op } from 'sequelize';
async function run() {
  const msgs = await models.Message.findAll({ where: { content: { [Op.like]: '%compromiso%' } } });
  console.log('Found:', msgs.length);
  msgs.forEach(m => console.log(m.content));
  process.exit(0);
}
run();
