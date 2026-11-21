if(!process.env.DATABASE_URL)process.loadEnvFile('.env');
if(!new URL(process.env.DATABASE_URL).pathname.endsWith('/ebtesamty_ux_verification'))throw new Error('Legacy reset seed is restricted to the disposable verification database. Use demo:prepare for a separate presentation.');
require('tsx/cjs');
require('../prisma/seed.ts');
