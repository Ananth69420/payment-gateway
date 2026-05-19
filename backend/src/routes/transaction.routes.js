const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const {
  makeTransactionController,
} = require('../controller/transaction.controller');
const router = express.Router();

router.post('/', authMiddleware, makeTransactionController); // make a transaction

module.exports = router;
