const STATUS_CODES = require('../constant/statusCode');
const pool = require('../db/connection');

const makeTransactionController = async (req, res) => {
  // Missing Validation
  const connection = await pool.getConnection();
  const { senderUpiHandle, receiverUpiHandle, amount } = req.body;

  let senderAccountId;
  let receiverAccountId;

  // Getting the account id
  try {
    try {
      const query = `
        SELECT upi_handle, accountId
        FROM Upi
        WHERE upi_handle = ? OR upi_handle = ?
        `;
      const [rows] = await connection.query(query, [
        senderUpiHandle,
        receiverUpiHandle,
      ]);

      for (const row of rows) {
        if (row.upi_handle === senderUpiHandle) {
          senderAccountId = row.accountId;
        }
        if (row.upi_handle === receiverUpiHandle) {
          receiverAccountId = row.accountId;
        }
      }
    } catch (error) {
      console.error(error);
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Sender UPI Id or Reciever UPI Id is invalid or missing',
      });
    }
    await connection.query('START TRANSACTION');
    // deduct money
    await connection.execute(
      'UPDATE Accounts SET balance = balance - ? WHERE accountId = ?',
      [amount, senderAccountId],
    );

    await connection.execute(
      'UPDATE Accounts SET balance = balance + ? WHERE accountId = ?',
      [amount, receiverAccountId],
    );

    const [transactionRows] = await connection.execute(
      `
    INSERT INTO Transactions 
    (senderId, receiverId, amount, STATUS)
    VALUES (?, ?, ?, ?)
  `,
      [senderAccountId, receiverAccountId, amount, 'success'],
    );

    const transactionId = transactionRows.insertId;

    const query = `
        INSERT INTO TransactionLog (transactionId, message)
        VALUES (? , ?);
        `;
    const [logRows] = await connection.query(query, [
      transactionId,
      'Successful',
    ]);
    await connection.query('COMMIT');

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Payment Successfully transfered',
    });
  } catch (error) {
    console.error(error);
    await connection.query('ROLLBACK');
    const [transactionRows] = await connection.execute(
      `
    INSERT INTO Transactions 
    (senderId, receiverId, amount, STATUS)
    VALUES (?, ?, ?, ?)
  `,
      [senderAccountId, receiverAccountId, amount, 'failed'],
    );

    const transactionId = transactionRows.insertId;

    const query = `
        INSERT INTO TransactionLog (transactionId, message)
        VALUES (? , ?);
        `;
    const [logRows] = await connection.query(query, [transactionId, 'failed']);
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: 'Internal Server Error' });
  } finally {
    connection.release();
  }
};

module.exports = { makeTransactionController };
