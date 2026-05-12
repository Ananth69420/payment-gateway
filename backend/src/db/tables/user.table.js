const pool = require('../connection');

async function createUserTable() {
  const query = `
        CREATE TABLE IF NOT EXISTS Users (
            userId INT PRIMARY KEY AUTO_INCREMENT,
            username VARCHAR(15) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            phone_number VARCHAR(10) NOT NULL UNIQUE,
            DOB DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
  // for the date use this format - YYYY-MM-DD
  await pool.query(query);
  console.log('User table ready!');
}

module.exports = createUserTable;
