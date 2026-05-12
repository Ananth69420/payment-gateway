require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initTable = require('./db/tables');
const bankRoutes = require('./routes/bank.routes');
const userRoutes = require('./routes/user.routes');
const accountRoutes = require('./routes/account.routes');

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors())
app.use(express.json());

app.use('/api/v1/banks', bankRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/account', accountRoutes);

async function startServer() {
  try {
    await initTable();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}
startServer();
