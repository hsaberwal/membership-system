const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nSQL Update command:');
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'admin';`);
}

generateHash();
