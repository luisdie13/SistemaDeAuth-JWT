const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Verificación de conexión inmediata
(async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('PostgreSQL conectado correctamente');
  } catch (err) {
    console.error('Error de conexión a PostgreSQL:', err.message);
    process.exit(1);
  }
})();

module.exports = pool;