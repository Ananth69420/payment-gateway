const pool = require('../connection');

async function createUPITable() {
  const query = `
        CREATE TABLE IF NOT EXISTS Upi (
            upiId INT PRIMARY KEY AUTO_INCREMENT,
            accountId INT ,
            userId INT,
            upi_handle VARCHAR(50) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (accountId) REFERENCES Accounts(accountId) ON DELETE CASCADE,
            FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE
        )
    `;
  //  ON DELETE CASCADE maintains REFRNTIAL INTEGRITY
  await pool.query(query);
  console.log('UPI table ready!');
}

module.exports = createUPITable;
