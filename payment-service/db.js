const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function initDb() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      amount NUMERIC NOT NULL,
      user_email TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await client.query(`
    CREATE OR REPLACE FUNCTION trigger_set_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_trigger'
      ) THEN
        CREATE TRIGGER set_timestamp_trigger
        BEFORE UPDATE ON payments
        FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
      END IF;
    END$$;
  `);
}

async function createPayment({ id, amount, user_email, status }) {
  await client.query('INSERT INTO payments (id, amount, user_email, status) VALUES ($1,$2,$3,$4)', [id, amount, user_email, status]);
}

async function updatePaymentStatus(id, status) {
  await client.query('UPDATE payments SET status=$1 WHERE id=$2', [status, id]);
}

async function getPayment(id) {
  const res = await client.query('SELECT * FROM payments WHERE id=$1', [id]);
  return res.rows[0];
}

module.exports = { initDb, createPayment, updatePaymentStatus, getPayment };