const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const {
  setUPIController,
  deleteUPIController,
  getUPIByUserController,
  getUPIByUserAndUPIController,
} = require('../controller/upi.controller');
const router = express.Router();

router.post('/', authMiddleware, setUPIController); // creates a upi account
router.get('/', authMiddleware, getUPIByUserController); // get all upi
router.get('/:upiId', authMiddleware, getUPIByUserAndUPIController); // get single upi
router.delete('/', authMiddleware, deleteUPIController); // deletes upi
module.exports = router;
