const pool = require('../connection');

async function createBankTable() {
  const query = `
        CREATE TABLE IF NOT EXISTS Banks (
            bankId INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(30) NOT NULL,
            code VARCHAR(5) NOT NULL,
            STATUS ENUM('active','inactive') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
  await pool.query(query);
  console.log('Bank table ready!');
}

module.exports = createBankTable;
