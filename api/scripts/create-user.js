// Usage: node scripts/create-user.js
// Creates a new user in the database with a bcrypt-hashed password.

require('dotenv').config({ path: '../../.env' });
const bcrypt = require('bcryptjs');
const readline = require('readline');
const db = require('../db');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

async function main() {
  const username = await ask('Username: ');
  const password = await ask('Password: ');

  if (!username || !password) {
    console.error('Username and password cannot be empty.');
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);
  await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed]);

  console.log(`User "${username}" created successfully.`);
  rl.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
