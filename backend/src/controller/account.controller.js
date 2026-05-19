const STATUS_CODES = require('../constant/statusCode');
const pool = require('../db/connection');
const { getBalanceBasedOnBank } = require('../utils/helper');
function generateAccountID() {
  const digits = '0123456789';
  let result = '';
  for (let i = 0; i < 9; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return Number(result);
}

const getAllAccountController = async (req, res) => {
  const userId = req.userId;
  try {
    const query = `SELECT accountId,userId,bankId,balance,status FROM Accounts WHERE userId = ?`;
    const [rows] = await pool.query(query, [userId]);

    res.status(STATUS_CODES.OK).json({
      success: true,
      accounts: rows,
      message: 'Fetched the all account',
    });
  } catch (error) {
    console.error("getAllAccountController : " + error);
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: error.message });
  }
};
const getAccountByIdController = async (req, res) => {
  const { accountId } = req.params;
  const userId = req.userId;
  try {
    const query = `SELECT accountId,userId,bankId,balance,status FROM Accounts WHERE userId = ? AND accountId = ?`;
    const [rows] = await pool.execute(query, [userId, accountId]);
    res.status(STATUS_CODES.OK).json({
      success: true,
      accounts: rows,
      message: 'Fetched a single account',
    });
  } catch (error) {
    console.error("getAccountByIdController : " + error);
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: error.message });
  }
};
const setAccountController = async (req, res) => {
  const { bankId, pin } = req.body;
  const userId = req.userId;

  // balance will be set automatically based on bank
  const balance = await getBalanceBasedOnBank(bankId);
  const accountNumber = generateAccountID();
  console.info('ACCOUNT NUMBER : ' + accountNumber);
  try {
    const query = `INSERT INTO Accounts (userId,bankId,pin,balance , accountNumber) VALUES (?,?,?,?,?)`;
    const [rows] = await pool.execute(query, [
      userId,
      bankId,
      pin,
      balance,
      accountNumber,
    ]);
    return res
      .status(STATUS_CODES.OK)
      .json({ success: true, message: 'Set Account details' });
  } catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: 'Internal Server Error',
    });
  }
};

const updateAccountController = async (req, res) => {
  // for now allow user to update their pin
  const { pin } = req.body;
  const userId = req.userId;

  try {
    const query = `UPDATE Accounts SET pin = ? WHERE userId = ?`;
    const [rows] = await pool.execute(query, [pin, userId]);
    res
      .status(STATUS_CODES.OK)
      .json({ success: true, message: 'Updated Account Pin' });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      handler: 'Update Account Controller',
    });
  }
};

module.exports = {
  getAllAccountController,
  getAccountByIdController,
  setAccountController,
  updateAccountController,
};
