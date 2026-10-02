import models from './models/index.js';
async function run() {
  const msgs = await models.Message.findAll({ limit: 50 });
  msgs.forEach(m => console.log(m.content));
  process.exit(0);
}
run();
