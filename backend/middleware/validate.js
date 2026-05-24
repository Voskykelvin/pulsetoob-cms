const { validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return sendError(res, {
    status: 422,
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    })),
  });
};

module.exports = validate;
