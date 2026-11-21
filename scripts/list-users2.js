const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://ebtesamty:ebtesamty_dev_secret@127.0.0.1:5432/ebtesamty?schema=public' });
client.connect()
  .then(() => client.query('SELECT email, role, name FROM "User" LIMIT 15'))
  .then(res => { res.rows.forEach(r => console.log(r.role, r.email)); client.end(); })
  .catch(e => { console.error(e.message); client.end(); });
