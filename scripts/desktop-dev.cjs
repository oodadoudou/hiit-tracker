const { spawn } = require('child_process');
const http = require('http');

const DEV_URL = 'http://127.0.0.1:5173';
const VITE_STARTUP_TIMEOUT_MS = 30000;

let viteProcess;
let electronProcess;
let shuttingDown = false;

function killProcess(child) {
  if (!child || child.killed) return;
  child.kill();
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  killProcess(electronProcess);
  killProcess(viteProcess);
  process.exit(code);
}

function waitForServer(deadlineMs) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const request = http.get(DEV_URL, (response) => {
        response.resume();
        resolve();
      });
      request.on('error', () => {
        if (Date.now() >= deadlineMs) {
          reject(new Error(`Timed out waiting for Vite at ${DEV_URL}`));
          return;
        }
        setTimeout(attempt, 400);
      });
    };

    attempt();
  });
}

function run() {
  viteProcess = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1'], {
    stdio: 'inherit',
    shell: true,
  });

  viteProcess.on('exit', (code) => {
    if (!shuttingDown) shutdown(code ?? 0);
  });

  waitForServer(Date.now() + VITE_STARTUP_TIMEOUT_MS)
    .then(() => {
      if (shuttingDown) return;
      electronProcess = spawn('npx', ['electron', '.'], {
        stdio: 'inherit',
        shell: true,
      });

      electronProcess.on('exit', (code) => shutdown(code ?? 0));
    })
    .catch((error) => {
      console.error(error.message);
      shutdown(1);
    });
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => shutdown(0));
});

run();
