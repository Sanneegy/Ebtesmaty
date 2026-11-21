const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

const binDir = path.resolve(
  'C:\\Users\\basan\\.gemini\\antigravity\\brain\\30b7d248-c8ce-4102-bee3-fbfc567f9eba\\scratch\\test_pg\\node_modules\\@embedded-postgres\\windows-x64\\native\\bin'
);
const dataDir = path.resolve('C:\\Users\\basan\\.ebtesamty_pgdata');
const postgresExe = path.join(binDir, 'postgres.exe');
const pgCtl = path.join(binDir, 'pg_ctl.exe');

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function start() {
  const open = await isPortOpen(5432);
  if (open) {
    console.log('[PostgreSQL] Server already running on port 5432.');
    return;
  }

  console.log('[PostgreSQL] Starting database daemon on port 5432...');
  const logFile = path.join(dataDir, 'server.log');
  execSync(`"${pgCtl}" start -D "${dataDir}" -l "${logFile}"`, { stdio: 'inherit' });

  let retries = 20;
  while (retries > 0) {
    await new Promise((r) => setTimeout(r, 500));
    if (await isPortOpen(5432)) {
      console.log('[PostgreSQL] Successfully started and listening on 127.0.0.1:5432.');
      return;
    }
    retries--;
  }

  console.error('[PostgreSQL] Timeout waiting for PostgreSQL to start.');
  process.exit(1);
}

start();
