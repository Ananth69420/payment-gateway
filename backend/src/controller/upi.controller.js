const STATUS_CODES = require('../constant/statusCode');
const pool = require('../db/connection');

const setUPIController = async (req, res) => {
  // <username>@ok<bankname>bank - googlepay
  // <username>@prob<bankname>bank
  const userId = req.userId;
  const { accountId } = req.body;
  try {
    const getQuery = `SELECT U.username , B.code FROM Users U JOIN Accounts A ON A.userId = U.userId JOIN Banks B ON A.bankId = B.bankId WHERE A.userId = ?`;
    const [getRows] = await pool.execute(getQuery, [userId]);

    const username = getRows[0].username;
    const code = getRows[0].code.toLowerCase();

    const upi_handle = `${username}@prob${code}bank`;

    const insertQuery = `INSERT INTO upi (accountId,upi_handle) VALUES (?,?)`;
    const [insertRows] = await pool.execute(insertQuery, [
      accountId,
      upi_handle,
    ]);

    res
      .status(STATUS_CODES.OK)
      .json({ success: true, message: 'UPI account created successfully' });
  } catch (error) {
    console.error('setUPIController Controller : ' + error);

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
    });
  }
};

const getUPIByUserController = async (req, res) => {
  const userId = req.userId;

  try {
    const query = `SELECT upiId , accountId , upi_handle FROM upi WHERE userId = ?`;
    const [rows] = await pool.execute(query, [userId]);

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'UPI account fetched successfully',
      rows: rows[0],
    });
  } catch (error) {
    console.error('getBankByUserIdController Controller : ' + error);

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
    });
  }
};

const getUPIByUserAndUPIController = async (req, res) => {
  const userId = req.userId;
  const upiId = req.params.upiId;

  try {
    const query = `SELECT upiId , accountId , upi_handle FROM upi WHERE userId = ? AND upiId = ?`;
    const [rows] = await pool.execute(query, [userId, upiId]);

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'UPI account fetched successfully',
      rows: rows[0],
    });
  } catch (error) {
    console.error('getUPIByUserAndUPIController Controller : ' + error);

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
    });
  }
};
const deleteUPIController = async (req, res) => {
  const userId = req.userId;

  try {
    const query = `DELETE FROM upi WHERE userId = ?`;
    const [rows] = await pool.execute(query, [userId]);

    res.status(STATUS_CODES.ACCEPTED).json({
      success: true,
      message: 'UPI account deleted successfully',
    });
  } catch (error) {
    console.error('deleteUPIController Controller : ' + error);

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  setUPIController,
  deleteUPIController,
  getUPIByUserController,
  getUPIByUserAndUPIController,
};
