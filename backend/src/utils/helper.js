const pool = require('../db/connection');

const extractYear = (dob) => {
  const year = dob.split('-')[0];

  if (year.length != 4 || isNaN(year)) {
    throw new Error('Invalid Year Format');
  }

  return dob.slice(0, 4);
};

const isLegalAge = (dob) => {
  const date = new Date();

  return date.getFullYear() - parseInt(extractYear(dob)) >= 18;
};

const getBalanceBasedOnBank = async (bankId) => {
  try {
    const query = `SELECT code FROM Banks`;
    const [rows] = await pool.execute(query);

    if (rows[0].code == 'PNB') return 1000;
    else if (rows[0].code == 'SBI') return 2000;
    else if (rows[0].code == 'ICICI') return 500;
    else if (rows[0].code == 'HDFC') return 10000;
    else if (rows[0].code == 'UBIN') return 3000;
    else return 5000;
  } catch (error) {
    console.log('GetBalanceBasedOnBank Error');
    console.log(error);
    return 0;
  }
};

module.exports = {
  extractYear,
  isLegalAge,
  getBalanceBasedOnBank,
};
