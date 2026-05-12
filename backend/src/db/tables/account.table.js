const pool = require('../connection');

async function createAccountTable() {
  const query = `
        CREATE TABLE IF NOT EXISTS Accounts (
            accountId INT PRIMARY KEY AUTO_INCREMENT,
            userId INT ,
            bankId INT ,
            pin INT NOT NULL,
            balance DECIMAL(15,5) NOT NULL CHECK (balance >= 0) DEFAULT 0,
            status ENUM('active','inactive') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE, 
            FOREIGN KEY (bankId) REFERENCES Banks(bankId) ON DELETE CASCADE
        )
    `;
  //  ON DELETE CASCADE maintains REFRNTIAL INTEGRITY

  await pool.query(query);
  console.log('Account table ready!');
}

module.exports = createAccountTable;
