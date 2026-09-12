// Uso: node dashboard/gerar-senha.js suaSenhaForte
// Copie o hash gerado para DASHBOARD_PASSWORD_HASH no arquivo .env
const bcrypt = require('bcryptjs');

const senha = process.argv[2];
if (!senha) {
  console.log('Uso: node dashboard/gerar-senha.js suaSenhaForte');
  process.exit(1);
}

const hash = bcrypt.hashSync(senha, 10);
console.log('\nCole isto no seu .env em DASHBOARD_PASSWORD_HASH:\n');
console.log(hash);
console.log('');
