const STATUS_CODES = require('../constant/statusCode');
const pool = require('../db/connection');

const getAllBankController = async (req, res) => {
  
  try {
    const query = `SELECT * FROM Banks`;
    const [rows] = await pool.query(query);
    res.status(STATUS_CODES.OK).json({
      success: true,
      banks: rows,
      message: 'Fetched the all bank details',
    });
  } catch (error) {
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: error.message });
  }
};
const getBankByIdController = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `SELECT * FROM Banks WHERE bankId = ?`;
    const [rows] = await pool.execute(query, [id]);
    res.status(STATUS_CODES.OK).json({
      success: true,
      banks: rows,
      message: 'Fetched a single bank details',
      handler: 'GetBankByIdController',
    });
  } catch (error) {
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: error.message });
  }
};
const setBankController = async (req, res) => {
  const { name, code } = req.body;
  try {
    const query = `INSERT INTO Banks (name,code) VALUES (?,?)`;
    const [rows] = await pool.execute(query, [name, code]);
    res
      .status(STATUS_CODES.OK)
      .json({ success: true, banks: rows, message: 'Set single bank details' });
  } catch (error) {
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: error.message });
  }
};
const updateBankController = async (req, res) => {
  const { id } = req.params;
  try {
    // we need to update this query
    const query = `SELECT * FROM Banks WHERE bankId = ?`;
    const [rows] = await pool.execute(query, [id]);
    res
      .status(STATUS_CODES.OK)
      .json({ success: true, banks: rows, message: 'Updated bank details' });
  } catch (error) {
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: error.message });
  }
};
const deleteBankController = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `DELETE FROM Banks WHERE bankId = ?`;
    const [rows] = await pool.execute(query, [id]);
    res
      .status(STATUS_CODES.OK)
      .json({ success: true, banks: rows, message: 'Deleted bank details' });
  } catch (error) {
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllBankController,
  getBankByIdController,
  setBankController,
  updateBankController,
  deleteBankController,
};
