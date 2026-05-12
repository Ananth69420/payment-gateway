const jwt = require('jsonwebtoken');
const STATUS_CODES = require('../constant/statusCode');

const authMiddleware = (req, res, next) => {
  try {
    const authToken = req.headers.Authorization || req.headers.authorization;
    if (!authToken || !authToken.startsWith('Bearer ')) {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ success: false, message: 'Invalid Token' });
    }

    const token = authToken.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.userId = decoded.userId;
      next();
    } catch (error) {
      console.log(error);

      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ success: false, message: 'Wrong Token', error });
    }
  } catch (error) {
    console.log(error);

    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: error, message: 'Auth Middleware Error' });
  }
};

module.exports = authMiddleware;
