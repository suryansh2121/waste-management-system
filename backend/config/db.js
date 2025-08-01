const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true, 
    rejectUnauthorized: true, 
  },
  max: 10,
  idleTimeoutMillis: 10000,
  
});


(async () => {
  try {
    console.log('Connecting to PostgreSQL:', process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@'));
    const client = await pool.connect();
    console.log('PostgreSQL connected successfully');
    const res = await client.query('SELECT NOW()');
    console.log('Database time:', res.rows[0]);
    client.release();
  } catch (error) {
    console.error('PostgreSQL connection failed:', error.message, error.stack);
    process.exit(-1);
  }
})();

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
  process.exit(-1);
});

module.exports = { pool };