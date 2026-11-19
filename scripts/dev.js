import { spawn } from 'node:child_process';

const children = [
  { name: 'backend', cwd: 'server', args: ['--watch', 'server.js'] },
  { name: 'frontend', cwd: 'client', args: ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'] },
].map(({ name, cwd, args }) => {
  const child = spawn(process.execPath, args, {
    cwd: new URL(`../${cwd}/`, import.meta.url),
    env: process.env,
    stdio: 'inherit',
  });

  child.on('error', (error) => {
    console.error(`[${name}] Could not start: ${error.message}`);
    shutdown(1);
  });

  child.on('exit', (code, signal) => {
    if (!stopping) {
      console.error(`[${name}] stopped${signal ? ` (${signal})` : ` with exit code ${code}`}.`);
      shutdown(typeof code === 'number' && code !== 0 ? code : 1);
    }
  });

  return child;
});

let stopping = false;

function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill();
  }
  process.exitCode = exitCode;
}

process.once('SIGINT', () => shutdown());
process.once('SIGTERM', () => shutdown());

console.info('Starting frontend and backend. Press Ctrl+C to stop both.');
console.info('Frontend: http://127.0.0.1:5173 | Backend: http://localhost:5000');
