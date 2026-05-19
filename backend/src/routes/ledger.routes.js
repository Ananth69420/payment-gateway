const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const router = express.Router();

router.get('/', authMiddleware, getLedgerController); // display all banks

module.exports = router;
