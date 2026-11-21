/* Usage: npm run hash-password -- "your long password"
   Prints a value for the ADMIN_PASSWORD_HASH environment variable in Vercel. */
const { hashPassword } = require('../lib/auth');
const pw = process.argv.slice(2).join(' ');
if (pw.length < 10) { console.error('Give a password of at least 10 characters:  npm run hash-password -- "my long password"'); process.exit(1); }
console.log('\nADMIN_PASSWORD_HASH=' + hashPassword(pw) + '\n');
console.log('Also set SESSION_SECRET to a random value, for example:\nSESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex') + '\n');
