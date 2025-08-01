const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Test PostgreSQL connection
(async () => {
  try {
    console.log('Connecting to PostgreSQL:', process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@')); // Hide password
    const client = await pool.connect();
    console.log('PostgreSQL connected successfully');
    const res = await client.query('SELECT NOW()');
    console.log('Database time:', res.rows[0]);
    client.release();
  } catch (error) {
    console.error('PostgreSQL connection failed:', error.message, error.stack);
    process.exit(-1); // Crash app to ensure logs are visible
  }
})();

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Test Supabase client (optional)
(async () => {
  try {
    console.log('Testing Supabase client with URL:', process.env.SUPABASE_URL);
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log('Supabase client test successful:', data);
  } catch (error) {
    console.error('Supabase client test failed:', error.message, error.stack);
  }
})();

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
  process.exit(-1);
});

module.exports = { pool, supabase };