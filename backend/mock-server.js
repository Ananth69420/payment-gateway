const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

let accounts = [
  {
    accountId: 1000000001,
    bankId: 1,
    balance: 75000.50,
    status: 'active',
    upiId: 'testuser@okhdfcbank'
  },
  {
    accountId: 1000000002,
    bankId: 2,
    balance: 12000.00,
    status: 'active',
    upiId: 'testuser@oksbi'
  }
];

let transactions = [
  {
    id: 'TXN849302194830',
    transactionId: 'TXN849302194830',
    senderAccount: '1000000001',
    senderUpiId: 'testuser@okhdfcbank',
    receiverUpiId: 'merchant@okaxis',
    amount: 1200.00,
    bankId: 1,
    type: 'Debit',
    desc: 'Grocery Store Payment',
    status: 'SUCCESS',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'TXN201948301932',
    transactionId: 'TXN201948301932',
    senderAccount: '1000000002',
    senderUpiId: 'testuser@oksbi',
    receiverUpiId: 'landlord@okicici',
    amount: 8500.00,
    bankId: 2,
    type: 'Debit',
    desc: 'Rent payment',
    status: 'SUCCESS',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

app.post('/api/v1/user/login', (req, res) => {
  res.json({
    accessToken: 'mock_access_token_12345',
    username: req.body.email ? req.body.email.split('@')[0] : 'testuser'
  });
});

app.post('/api/v1/user/register', (req, res) => {
  res.json({
    accessToken: 'mock_access_token_12345',
    username: req.body.username || 'testuser'
  });
});

app.get('/api/v1/banks', (req, res) => {
  res.json({
    banks: [
      { bankId: 1, name: 'HDFC Bank', code: 'HDFC' },
      { bankId: 2, name: 'State Bank of India', code: 'SBI' },
      { bankId: 3, name: 'ICICI Bank', code: 'ICICI' },
      { bankId: 4, name: 'Axis Bank', code: 'AXIS' },
      { bankId: 5, name: 'Probably A Bank', code: 'PROB' }
    ]
  });
});

app.get('/api/v1/account', (req, res) => {
  res.json({ accounts });
});

app.post('/api/v1/account', (req, res) => {
  const { bankId, pin } = req.body;
  const newAccount = {
    accountId: Math.floor(1000000000 + Math.random() * 9000000000),
    bankId: parseInt(bankId),
    balance: 100000.00,
    status: 'active',
    upiId: `testuser@${['okhdfcbank', 'oksbi', 'okicici', 'okaxis', 'okprobably'][bankId - 1] || 'okbank'}`
  };
  accounts.push(newAccount);
  res.json({ success: true, account: newAccount });
});

app.get('/api/v1/upi/transactions', (req, res) => {
  res.json({ transactions });
});

app.post('/api/v1/upi/transfer', (req, res) => {
  const { senderAccountId, receiverUpiId, amount, description } = req.body;
  const amt = parseFloat(amount);
  
  const senderIndex = accounts.findIndex(acc => acc.accountId.toString() === senderAccountId.toString());
  if (senderIndex === -1) {
    return res.status(404).json({ message: 'Sender account not found' });
  }
  
  if (accounts[senderIndex].balance < amt) {
    return res.status(400).json({ message: 'Insufficient funds' });
  }
  
  accounts[senderIndex].balance -= amt;
  
  const newTx = {
    id: 'TXN' + Math.floor(Math.random() * 1000000000000),
    transactionId: 'TXN' + Math.floor(Math.random() * 1000000000000),
    senderAccount: senderAccountId.toString(),
    senderUpiId: accounts[senderIndex].upiId,
    receiverUpiId,
    amount: amt,
    bankId: accounts[senderIndex].bankId,
    type: 'Debit',
    desc: description || `Transfer to ${receiverUpiId}`,
    status: 'SUCCESS',
    timestamp: new Date().toISOString()
  };
  
  transactions.unshift(newTx);
  res.json({ success: true, transaction: newTx });
});

app.listen(PORT, () => {
  console.log(`Mock API Server is running on http://localhost:${PORT}`);
});
