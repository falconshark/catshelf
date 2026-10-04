const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = 12;
const USERNAME_RE = /^[A-Za-z0-9_.-]{3,64}$/;
// bcrypt silently ignores everything after 72 bytes
const MAX_PASSWORD_BYTES = 72;
const MIN_PASSWORD_LENGTH = 8;

// Returns an error message, or null when the credentials are acceptable.
function validateNewCredentials({ username, password } = {}) {
  if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
    return 'Username must be 3-64 characters: letters, digits, "_", "." or "-".';
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) {
    return `Password must be at most ${MAX_PASSWORD_BYTES} bytes.`;
  }
  return null;
}

function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Compared against when the username doesn't exist, so a failed login takes
// about as long whether or not the account exists.
let dummyHash;
async function verifyPassword(password, hash) {
  if (!hash) {
    dummyHash ??= await bcrypt.hash('dummy-password', BCRYPT_ROUNDS);
    await bcrypt.compare(password, dummyHash);
    return false;
  }
  return bcrypt.compare(password, hash);
}

module.exports = { validateNewCredentials, hashPassword, verifyPassword };
