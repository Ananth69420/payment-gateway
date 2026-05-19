const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const {
  setUPIController,
  deleteUPIController,
  getUPIByUserController,
  getUPIByUserAndUPIController,
} = require('../controller/upi.controller');
const router = express.Router();

const pool = require('../db/connection');

router.post('/', authMiddleware, setUPIController); // creates a upi account
router.get('/', authMiddleware, getUPIByUserController); // get all upi

router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const [accounts] = await pool.query('SELECT accountId FROM Accounts WHERE userId = ?', [userId]);
    const accountId = accounts.length > 0 ? accounts[0].accountId : 1;

    const mockLedger = [
      {
        ledgerId: 101,
        accountId: accountId,
        transactionId: 5001,
        entry_type: 'debit',
        amount: "1250.00",
        balance_after: "3750.00",
        senderUpiId: "me@probokbank",
        receiverUpiId: "friend@probokbank",
        desc: "Dinner splitting",
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        ledgerId: 102,
        accountId: accountId,
        transactionId: 5002,
        entry_type: 'credit',
        amount: "800.00",
        balance_after: "4550.00",
        senderUpiId: "boss@company",
        receiverUpiId: "me@probokbank",
        desc: "Freelance reward",
        created_at: new Date(Date.now() - 7200000).toISOString()
      }
    ];

    return res.status(200).json({
      success: true,
      transactions: mockLedger
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:upiId', authMiddleware, getUPIByUserAndUPIController); // get single upi
router.delete('/', authMiddleware, deleteUPIController); // deletes upi
module.exports = router;
