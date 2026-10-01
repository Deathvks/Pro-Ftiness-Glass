import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

async function run() {
    try {
        await sequelize.query('ALTER TABLE messages ADD COLUMN is_closed BOOLEAN DEFAULT false;');
        console.log('Added is_closed');
    } catch (e) {
        console.log('is_closed error or already exists:', e.message);
    }
    
    try {
        await sequelize.query('ALTER TABLE messages ADD COLUMN bot_reminder_level INT DEFAULT 0;');
        console.log('Added bot_reminder_level');
    } catch (e) {
        console.log('bot_reminder_level error or already exists:', e.message);
    }
    
    process.exit(0);
}
run();
