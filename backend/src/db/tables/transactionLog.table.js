const pool = require('../connection');

async function createTransactionLogTable() {
  const query = `
        CREATE TABLE IF NOT EXISTS TransactionLog (
            TransactionLogId INT PRIMARY KEY AUTO_INCREMENT,
            transactionId INT,
            STATUS ENUM('success','failed') DEFAULT 'success',
            message VARCHAR(50),
            FOREIGN KEY (transactionId) REFERENCES Transactions(transactionId) ON DELETE CASCADE
        )
    `;
  await pool.query(query);
  console.log('TransactionLog table ready!');
}

module.exports = createTransactionLogTable;
