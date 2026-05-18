const createAccountTable = require('./account.table');
const createBankTable = require('./bank.table');
const createTransactionsTable = require('./transaction.table');
const createTransactionLogTable = require('./transactionLog.table');
const createUPITable = require('./upi.table');
const createUserTable = require('./user.table');

async function initTable() {
  await createBankTable();
  await createUserTable();
  await createAccountTable();
  await createUPITable();
  await createTransactionsTable();
  await createTransactionLogTable();
}

module.exports = initTable;
