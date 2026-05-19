const getLedgerController = (req, res) => {
  const {accountId} = req.body;

    try {
    const query = `SELECT * FROM Ledger WHERE accountId = ?`;
    const [rows] = await pool.execute(query, [accountId]);
    res
      .status(STATUS_CODES.OK)
      .json({ success: true, ledger: rows, message: 'Fetched Ledger Successfully' });
  } catch (error) {
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: error.message });
  }
};
