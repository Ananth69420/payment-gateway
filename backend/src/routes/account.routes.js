const express = require('express');
const {
  getAccountByIdController,
  setAccountController,
  updateAccountController,
  getAllAccountController,
} = require('../controller/account.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const router = express.Router();

router.get('/', authMiddleware, getAllAccountController); // return all single user accounts
router.get('/:accountId', authMiddleware, getAccountByIdController); // return single account
router.post('/', authMiddleware, setAccountController); // creates new account
router.put('/update-pin', authMiddleware, updateAccountController); // updates account pin

module.exports = router;
