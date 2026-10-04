const db = require('../db');
const { validateNewCredentials, hashPassword } = require('./credentials');

// Creates the initial account from ADMIN_USERNAME / ADMIN_PASSWORD, but only
// while the users table is empty, so later restarts never touch existing accounts.
async function seedAdmin() {
  const { ADMIN_USERNAME: username, ADMIN_PASSWORD: password } = process.env;
  if (!username && !password) return;

  const invalid = validateNewCredentials({ username, password });
  if (invalid) throw new Error(`Invalid ADMIN_USERNAME / ADMIN_PASSWORD: ${invalid}`);

  const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM users');
  if (count > 0) return;

  await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [
    username,
    await hashPassword(password),
  ]);
  console.log(`Created initial user "${username}"`);
}

module.exports = seedAdmin;
