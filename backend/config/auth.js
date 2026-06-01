function requiredSecret(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for authentication.`);
  }
  return value;
}

const accessTokenSecret = requiredSecret('JWT_SECRET');
const explicitRefreshSecret = process.env.JWT_REFRESH_SECRET?.trim();
const refreshTokenSecret = explicitRefreshSecret || accessTokenSecret;

if (!explicitRefreshSecret && process.env.NODE_ENV === 'production') {
  console.warn('JWT_REFRESH_SECRET is not set. Falling back to JWT_SECRET; set a separate refresh secret in production.');
}

module.exports = {
  accessTokenSecret,
  refreshTokenSecret,
  accessTokenExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
};
