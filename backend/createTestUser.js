import dotenv from 'dotenv';
dotenv.config({ path: 'c:/proyectos/Pro-Ftiness-Glass/backend/.env' });
import bcrypt from 'bcryptjs';
import db from './models/index.js';

async function createTestUser() {
  try {
    const { User, Routine } = db;
    const email = 'revisor@profitness.com';
    const password = 'GooglePlay2026!';
    
    // Check if exists
    let user = await User.findOne({ where: { email } });
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        username: 'RevisorGoogle',
        name: 'Revisor Play Store',
        email,
        password_hash: hashedPassword,
        role: 'user',
        is_verified: true,
        onboarding_completed: true,
        created_at: new Date()
      });
      console.log('User created:', email);
    } else {
      // Just update password and verified status in case
      const hashedPassword = await bcrypt.hash(password, 10);
      await user.update({ password_hash: hashedPassword, is_verified: true, onboarding_completed: true });
      console.log('User already exists, updated password:', email);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
  process.exit();
}

createTestUser();
