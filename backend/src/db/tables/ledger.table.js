const pool = require('../connection');

async function createLedgerTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS Ledger (
      ledgerId INT PRIMARY KEY AUTO_INCREMENT,
      accountId INT NOT NULL,
      transactionId INT NOT NULL,
      entry_type ENUM('debit', 'credit') NOT NULL,
      amount DECIMAL(10,3) NOT NULL,
      balance_after DECIMAL(10,3) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (accountId) REFERENCES Accounts(accountId) ON DELETE CASCADE,
      FOREIGN KEY (transactionId) REFERENCES Transactions(transactionId) ON DELETE CASCADE
    )
  `;

  await pool.query(query);

  console.log('Ledger table ready!');
}

module.exports = createLedgerTable;
