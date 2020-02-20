module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_TOKEN: process.env.API_TOKEN || 'dummy-api-token',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://kim:kim@localhost/myclassroom',
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api",
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret',
};