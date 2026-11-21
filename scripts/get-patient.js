const { Client } = require('pg');
const c = new Client('postgresql://ebtesamty:ebtesamty_dev_secret@127.0.0.1:5432/ebtesamty?schema=public');
c.connect()
  .then(() => c.query('SELECT id, "fullName" FROM patients LIMIT 1'))
  .then(r => {
    console.log(r.rows);
    c.end();
  });
