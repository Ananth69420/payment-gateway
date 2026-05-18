const createAccountTable = require('./account.table');
const createBankTable = require('./bank.table');
const createUserTable = require('./user.table');

async function initTable() {
  await createBankTable();
  await createUserTable();
  await createAccountTable();
}

module.exports = initTable;
