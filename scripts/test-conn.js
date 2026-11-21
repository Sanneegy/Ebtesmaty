const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://ebtesamty:ebtesamty_dev_secret@127.0.0.1:5432/ebtesamty?schema=public'
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB!');
    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log('Tables:', tables.rows.map(r => r.table_name));
    if (tables.rows.some(r => r.table_name === 'users')) {
      const users = await client.query('SELECT email, "name" FROM users LIMIT 5');
      console.log('Users in users table:', users.rows);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
