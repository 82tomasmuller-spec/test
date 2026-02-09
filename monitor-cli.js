#!/usr/bin/env node

const http = require('http');
const readline = require('readline');

const API_BASE = 'http://localhost:5000';

// HTTP request helper
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: data ? { 'Content-Type': 'application/json' } : {}
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Format monitor display
function displayMonitor(monitor) {
  const result = monitor.lastResult;
  const status = result ? result.status : 'waiting';
  const statusIcon = status === 'up' ? '✓' : status === 'down' ? '✗' : '○';
  const statusColor = status === 'up' ? '\x1b[32m' : status === 'down' ? '\x1b[31m' : '\x1b[33m';

  const intervalMs = monitor.interval;
  const intervalText = intervalMs < 60000
    ? `${intervalMs / 1000}s`
    : intervalMs < 3600000
      ? `${intervalMs / 60000}m`
      : `${intervalMs / 3600000}h`;

  console.log(`\n${statusColor}${statusIcon}\x1b[0m ID: ${monitor.id}`);
  console.log(`   URL: ${monitor.url}`);
  console.log(`   Interval: ${intervalText}`);

  if (result) {
    console.log(`   Status: ${statusColor}${status.toUpperCase()}\x1b[0m`);
    console.log(`   Response: ${result.responseTime}ms`);
    if (result.statusCode) console.log(`   HTTP: ${result.statusCode}`);
    if (result.error) console.log(`   Error: \x1b[31m${result.error}\x1b[0m`);
    console.log(`   Last check: ${new Date(result.timestamp).toLocaleString('cs-CZ')}`);
  } else {
    console.log(`   Status: \x1b[33mWaiting for first check...\x1b[0m`);
  }
}

// Commands
async function listMonitors() {
  const monitors = await request('GET', '/api/monitors');

  if (monitors.length === 0) {
    console.log('\n\x1b[33m○ Žádné monitory\x1b[0m\n');
    return;
  }

  console.log(`\n\x1b[1m📊 Aktivní monitory (${monitors.length}):\x1b[0m`);
  monitors.forEach(displayMonitor);
  console.log('');
}

async function addMonitor(url, interval) {
  const intervalMs = interval * 1000;
  const monitor = await request('POST', '/api/monitors', { url, interval: intervalMs });
  console.log(`\n\x1b[32m✓ Monitor přidán!\x1b[0m`);
  displayMonitor({ ...monitor, lastResult: null });
  console.log('');
}

async function checkMonitor(id) {
  const result = await request('POST', `/api/monitors/${id}/check`);
  console.log(`\n\x1b[32m✓ Kontrola dokončena\x1b[0m`);
  displayMonitor(result);
  console.log('');
}

async function deleteMonitor(id) {
  await request('DELETE', `/api/monitors/${id}`);
  console.log(`\n\x1b[32m✓ Monitor smazán\x1b[0m\n`);
}

async function watchMonitors() {
  console.log('\x1b[1m👁  Live monitoring (Ctrl+C pro ukončení)...\x1b[0m\n');

  setInterval(async () => {
    console.clear();
    console.log('\x1b[1m🚀 ShopAlert Live Monitor\x1b[0m');
    console.log('\x1b[90m' + new Date().toLocaleString('cs-CZ') + '\x1b[0m');
    await listMonitors();
    console.log('\x1b[90m↻ Aktualizace každých 5 sekund...\x1b[0m');
  }, 5000);
}

// Interactive CLI
function showMenu() {
  console.log('\n\x1b[1m🚀 ShopAlert Monitor CLI\x1b[0m\n');
  console.log('  1. 📋 Zobrazit všechny monitory');
  console.log('  2. ➕ Přidat nový monitor');
  console.log('  3. 🔍 Manuální kontrola monitoru');
  console.log('  4. 🗑  Smazat monitor');
  console.log('  5. 👁  Live sledování (auto-refresh)');
  console.log('  0. 🚪 Ukončit\n');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  console.clear();

  // Check connection
  try {
    await request('GET', '/health');
    console.log('\x1b[32m✓ Backend připojen (localhost:5000)\x1b[0m');
  } catch (error) {
    console.log('\x1b[31m✗ Backend nedostupný!\x1b[0m');
    console.log('Spusťte: node standalone-backend.js\n');
    process.exit(1);
  }

  while (true) {
    showMenu();
    const choice = await prompt('Volba: ');

    try {
      switch (choice) {
        case '1':
          await listMonitors();
          await prompt('\nStiskněte Enter...');
          console.clear();
          break;

        case '2':
          console.log('\n\x1b[1mPřidat nový monitor:\x1b[0m');
          const url = await prompt('  URL (např. https://example.com): ');
          const intervalInput = await prompt('  Interval v sekundách (např. 30): ');
          const interval = parseInt(intervalInput) || 30;
          await addMonitor(url, interval);
          await prompt('Stiskněte Enter...');
          console.clear();
          break;

        case '3':
          await listMonitors();
          const checkId = await prompt('\nID monitoru k testování: ');
          await checkMonitor(checkId);
          await prompt('Stiskněte Enter...');
          console.clear();
          break;

        case '4':
          await listMonitors();
          const deleteId = await prompt('\nID monitoru ke smazání: ');
          const confirm = await prompt('Opravdu smazat? (ano/ne): ');
          if (confirm.toLowerCase() === 'ano') {
            await deleteMonitor(deleteId);
          }
          await prompt('Stiskněte Enter...');
          console.clear();
          break;

        case '5':
          await watchMonitors();
          break;

        case '0':
          console.log('\n👋 Nashledanou!\n');
          rl.close();
          process.exit(0);

        default:
          console.log('\n\x1b[31m✗ Neplatná volba\x1b[0m');
          await prompt('Stiskněte Enter...');
          console.clear();
      }
    } catch (error) {
      console.log(`\n\x1b[31m✗ Chyba: ${error.message}\x1b[0m`);
      await prompt('Stiskněte Enter...');
      console.clear();
    }
  }
}

// CLI arguments
const args = process.argv.slice(2);
if (args.length > 0) {
  const command = args[0];

  (async () => {
    try {
      if (command === 'list') {
        await listMonitors();
      } else if (command === 'add' && args[1]) {
        const interval = parseInt(args[2]) || 30;
        await addMonitor(args[1], interval);
      } else if (command === 'check' && args[1]) {
        await checkMonitor(args[1]);
      } else if (command === 'delete' && args[1]) {
        await deleteMonitor(args[1]);
      } else if (command === 'watch') {
        await watchMonitors();
      } else {
        console.log('Použití:');
        console.log('  node monitor-cli.js              # Interaktivní režim');
        console.log('  node monitor-cli.js list         # Zobrazit monitory');
        console.log('  node monitor-cli.js add <url> [interval]');
        console.log('  node monitor-cli.js check <id>');
        console.log('  node monitor-cli.js delete <id>');
        console.log('  node monitor-cli.js watch        # Live sledování');
      }
      process.exit(0);
    } catch (error) {
      console.error('Chyba:', error.message);
      process.exit(1);
    }
  })();
} else {
  main();
}
