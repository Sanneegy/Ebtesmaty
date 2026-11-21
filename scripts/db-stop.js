const { execSync } = require('child_process');
const path = require('path');

const binDir = path.resolve(
  'C:\\Users\\basan\\.gemini\\antigravity\\brain\\30b7d248-c8ce-4102-bee3-fbfc567f9eba\\scratch\\test_pg\\node_modules\\@embedded-postgres\\windows-x64\\native\\bin'
);
const dataDir = path.resolve('C:\\Users\\basan\\.ebtesamty_pgdata');
const pgCtl = path.join(binDir, 'pg_ctl.exe');

try {
  console.log('[PostgreSQL] Stopping database server...');
  execSync(`"${pgCtl}" -D "${dataDir}" stop -m fast`, { stdio: 'inherit' });
  console.log('[PostgreSQL] Stopped.');
} catch (e) {
  console.log('[PostgreSQL] Stop error or already stopped:', e.message);
}
