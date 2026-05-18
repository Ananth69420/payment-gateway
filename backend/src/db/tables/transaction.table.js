const pool = require('../connection');

async function createTransactionsTable() {
  const query = `
        CREATE TABLE IF NOT EXISTS Transactions (
            transactionId INT PRIMARY KEY AUTO_INCREMENT,
            senderId INT,
            receiverId INT,
            amount DECIMAL(10,3) NOT NULL,
            STATUS ENUM('success','failed') DEFAULT 'success',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (senderId) REFERENCES Accounts(accountId) ON DELETE CASCADE,
            FOREIGN KEY (receiverId) REFERENCES Accounts(accountId) ON DELETE CASCADE
        )
    `;
  await pool.query(query);
  console.log('Transaction table ready!');
}

module.exports = createTransactionsTable;
