require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const PORT = process.env.PORT || 5000;
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'ananth';

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// IN-MEMORY DATABASE STATE (MOCK DATABASE)
// ==========================================
const mockBanks = [
  { bankId: 1, name: "State Bank of India", code: "SBI", status: "active" },
  { bankId: 2, name: "HDFC Bank", code: "HDFC", status: "active" },
  { bankId: 3, name: "ICICI Bank", code: "ICICI", status: "active" },
  { bankId: 4, name: "Axis Bank", code: "AXIS", status: "active" }
];

const users = [
  {
    userId: 1,
    username: "testuser",
    password: bcrypt.hashSync("password123", 10),
    phone_number: "9876543210",
    DOB: "2000-01-01"
  }
];

const accounts = [
  {
    accountId: 10,
    userId: 1,
    bankId: 1,
    accountNumber: 123456789,
    pin: 1234,
    balance: 15000.00,
    status: 'active'
  },
  {
    accountId: 11,
    userId: 1,
    bankId: 2,
    accountNumber: 987654321,
    pin: 1234,
    balance: 7500.00,
    status: 'active'
  }
];

const upiList = [
  {
    upiId: 20,
    accountId: 10,
    userId: 1,
    upi_handle: "testuser@probsbibank"
  },
  {
    upiId: 21,
    accountId: 11,
    userId: 1,
    upi_handle: "testuser@probhdfcbank"
  }
];

const transactions = [
  {
    transactionId: 1001,
    senderId: 10,
    receiverId: 99,
    amount: 1250.00,
    STATUS: 'success',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    transactionId: 1002,
    senderId: 99,
    receiverId: 10,
    amount: 800.00,
    STATUS: 'success',
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

const ledger = [
  {
    ledgerId: 5001,
    accountId: 10,
    transactionId: 1001,
    entry_type: 'debit',
    amount: 1250.00,
    balance_after: 13750.00,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    senderUpiId: "testuser@probsbibank",
    receiverUpiId: "friend@okaxis",
    desc: "Dinner splitting"
  },
  {
    ledgerId: 5002,
    accountId: 10,
    transactionId: 1002,
    entry_type: 'credit',
    amount: 800.00,
    balance_after: 14550.00,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    senderUpiId: "boss@company",
    receiverUpiId: "testuser@probsbibank",
    desc: "Salary"
  }
];

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================
const authMiddleware = (req, res, next) => {
  try {
    const authToken = req.headers.authorization || req.headers.Authorization;
    if (!authToken || !authToken.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Invalid Token' });
    }
    const token = authToken.split(' ')[1];
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized session token expired' });
  }
};

// ==========================================
// API ROUTES
// ==========================================

// USER REGISTER
app.post('/api/v1/user/register', async (req, res) => {
  const { username, password, phone_number, dob } = req.body;
  if (!username || !password || !phone_number || !dob) {
    return res.status(400).json({ success: false, message: 'Missing Input Fields' });
  }

  const existingUser = users.find(u => u.username === username || u.phone_number === phone_number);
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Username/Phone is already taken' });
  }

  const newUser = {
    userId: users.length + 1,
    username,
    password: bcrypt.hashSync(password, 10),
    phone_number,
    DOB: dob
  };
  users.push(newUser);

  const token = jwt.sign({ userId: newUser.userId }, JWT_ACCESS_SECRET, { expiresIn: '2h' });
  return res.status(201).json({
    success: true,
    message: 'User created successfully',
    userId: newUser.userId,
    accessToken: token
  });
});

// USER LOGIN
app.post('/api/v1/user/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Missing username or password' });
  }

  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ success: false, message: 'Username or passwords do not match' });
  }

  const token = jwt.sign({ userId: user.userId }, JWT_ACCESS_SECRET, { expiresIn: '2h' });
  return res.status(200).json({
    success: true,
    message: 'User login successfully',
    userId: user.userId,
    accessToken: token
  });
});

// BANKS LIST
app.get('/api/v1/banks', (req, res) => {
  return res.status(200).json({ success: true, banks: mockBanks });
});

// SINGLE BANK BY ID
app.get('/api/v1/banks/:id', (req, res) => {
  const bank = mockBanks.find(b => b.bankId === parseInt(req.params.id));
  if (!bank) return res.status(404).json({ success: false, message: 'Bank not found' });
  return res.status(200).json({ success: true, banks: [bank] });
});

// USER ACCOUNTS
app.get('/api/v1/account', authMiddleware, (req, res) => {
  const userAccounts = accounts.filter(a => a.userId === req.userId);
  const enrichedAccounts = userAccounts.map(acc => {
    const upi = upiList.find(u => u.accountId === acc.accountId);
    return {
      ...acc,
      upiId: upi ? upi.upi_handle : null
    };
  });
  return res.status(200).json({ success: true, accounts: enrichedAccounts });
});

// SET BANK ACCOUNT Details
app.post('/api/v1/account', authMiddleware, (req, res) => {
  const { bankId, pin } = req.body;
  const newAccount = {
    accountId: Math.floor(100000 + Math.random() * 900000),
    userId: req.userId,
    bankId: parseInt(bankId),
    accountNumber: Math.floor(100000000 + Math.random() * 900000000),
    pin: parseInt(pin),
    balance: bankId === 1 ? 25000.00 : bankId === 2 ? 18000.00 : bankId === 3 ? 32000.00 : 15000.00,
    status: 'active'
  };
  accounts.push(newAccount);
  return res.status(200).json({ success: true, message: 'Set Account details' });
});

// UPDATE ACCOUNT PIN
app.put('/api/v1/account/update-pin', authMiddleware, (req, res) => {
  const { pin } = req.body;
  accounts.forEach(acc => {
    if (acc.userId === req.userId) {
      acc.pin = parseInt(pin);
    }
  });
  return res.status(200).json({ success: true, message: 'Updated Account Pin' });
});

// CREATE UPI Handle
app.post('/api/v1/upi', authMiddleware, (req, res) => {
  const { accountId } = req.body;
  const user = users.find(u => u.userId === req.userId);
  const acc = accounts.find(a => a.accountId === parseInt(accountId));
  if (!acc) return res.status(404).json({ success: false, message: 'Account not found' });
  const bank = mockBanks.find(b => b.bankId === acc.bankId);

  const upi_handle = `${user.username}@prob${bank.code.toLowerCase()}bank`;
  const newUpi = {
    upiId: Math.floor(100000 + Math.random() * 900000),
    accountId: acc.accountId,
    userId: req.userId,
    upi_handle
  };
  upiList.push(newUpi);
  return res.status(200).json({ success: true, message: 'UPI account created successfully' });
});

// MAKE A TRANSACTION
app.post('/api/v1/transaction', authMiddleware, (req, res) => {
  const { senderUpiHandle, receiverUpiHandle, amount } = req.body;
  if (!senderUpiHandle || !receiverUpiHandle || !amount) {
    return res.status(400).json({ success: false, message: 'Missing parameters' });
  }

  const parsedAmount = parseFloat(amount);
  const senderUpi = upiList.find(u => u.upi_handle.toLowerCase() === senderUpiHandle.toLowerCase());
  if (!senderUpi) {
    return res.status(400).json({ success: false, message: 'Sender UPI ID is invalid' });
  }

  const senderAcc = accounts.find(a => a.accountId === senderUpi.accountId);
  if (!senderAcc || senderAcc.balance < parsedAmount) {
    return res.status(400).json({ success: false, message: 'Insufficient funds' });
  }

  // Deduct from sender
  senderAcc.balance -= parsedAmount;

  const txnId = Math.floor(100000 + Math.random() * 900000);
  transactions.push({
    transactionId: txnId,
    senderId: senderAcc.accountId,
    receiverId: null,
    amount: parsedAmount,
    STATUS: 'success',
    created_at: new Date().toISOString()
  });

  // Write debit ledger row
  ledger.push({
    ledgerId: Math.floor(1000000 + Math.random() * 9000000),
    accountId: senderAcc.accountId,
    transactionId: txnId,
    entry_type: 'debit',
    amount: parsedAmount,
    balance_after: senderAcc.balance,
    created_at: new Date().toISOString(),
    senderUpiId: senderUpiHandle,
    receiverUpiId: receiverUpiHandle,
    desc: `UPI payment to ${receiverUpiHandle}`
  });

  // Credit to receiver if local
  const receiverUpi = upiList.find(u => u.upi_handle.toLowerCase() === receiverUpiHandle.toLowerCase());
  if (receiverUpi) {
    const receiverAcc = accounts.find(a => a.accountId === receiverUpi.accountId);
    if (receiverAcc) {
      receiverAcc.balance += parsedAmount;
      ledger.push({
        ledgerId: Math.floor(1000000 + Math.random() * 9000000),
        accountId: receiverAcc.accountId,
        transactionId: txnId,
        entry_type: 'credit',
        amount: parsedAmount,
        balance_after: receiverAcc.balance,
        created_at: new Date().toISOString(),
        senderUpiId: senderUpiHandle,
        receiverUpiId: receiverUpiHandle,
        desc: `UPI payment from ${senderUpiHandle}`
      });
    }
  }

  return res.status(200).json({ success: true, message: 'Payment Successfully transfered' });
});

// GET TRANSACTION LEDGER (MOCKED & FULLY NORMALIZED)
app.get('/api/v1/upi/transactions', authMiddleware, (req, res) => {
  const userAccountIds = accounts.filter(a => a.userId === req.userId).map(a => a.accountId);
  const userLedger = ledger.filter(l => userAccountIds.includes(l.accountId));

  const result = userLedger.map(l => {
    const acc = accounts.find(a => a.accountId === l.accountId);
    return {
      id: l.ledgerId,
      transactionId: `TXN${l.transactionId}`,
      bankId: acc ? acc.bankId : 1,
      senderUpiId: l.senderUpiId,
      receiverUpiId: l.receiverUpiId,
      senderAccount: acc ? acc.accountNumber.toString() : 'N/A',
      amount: parseFloat(l.amount),
      timestamp: l.created_at,
      desc: l.desc || (l.entry_type === 'credit' ? 'Money Received' : 'Money Sent'),
      description: l.entry_type === 'credit'
        ? `Received from ${l.senderUpiId}`
        : `Paid to ${l.receiverUpiId}`,
      type: l.entry_type === 'credit' ? 'Credit' : 'Debit',
      status: 'SUCCESS'
    };
  });

  return res.status(200).json({ success: true, transactions: result });
});

// ==========================================
// START EXPRESS SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`[MOCK SERVER] Running completely database-free at http://localhost:${PORT}`);
});
