const pool = require('../connection');

async function createBeneficiaryTable() {
  const query = `
        CREATE TABLE IF NOT EXISTS Beneficiary (
            beneficiaryId INT PRIMARY KEY AUTO_INCREMENT,
            senderId INT,
            receiverId INT,
            FOREIGN KEY (senderId) REFERENCES User(userId) ON DELETE CASCADE,
            FOREIGN KEY (receiverId) REFERENCES User(userId) ON DELETE CASCADE
        )
    `;
  await pool.query(query);
  console.log('Beneficiary table ready!');
}

module.exports = createBeneficiaryTable;
