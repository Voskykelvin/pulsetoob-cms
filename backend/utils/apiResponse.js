const sendSuccess = (res, { status = 200, data = null, message, pagination, meta } = {}) => {
  const payload = { success: true };

  if (data !== null) payload.data = data;
  if (message) payload.message = message;
  if (pagination) payload.pagination = pagination;
  if (meta) payload.meta = meta;

  return res.status(status).json(payload);
};

const sendError = (res, { status = 500, message = 'Internal Server Error', code, details } = {}) => {
  const payload = {
    success: false,
    error: message,
  };

  if (code) payload.code = code;
  if (details) payload.details = details;

  return res.status(status).json(payload);
};

module.exports = { sendSuccess, sendError };
