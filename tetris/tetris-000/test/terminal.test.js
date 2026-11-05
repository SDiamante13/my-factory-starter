import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';

// A real pseudo-terminal exercises readline raw input and termios restoration,
// neither of which can be verified by piping stdin or mocking isTTY.
test('npm start works in a 24-row terminal', {
  timeout: 30000,
  skip: process.platform === 'win32' ? 'requires POSIX PTYs and Python 3' : false,
}, async () => {
  const { stdout } = await promisify(execFile)('python3', ['test/terminal-smoke.py'], {
    timeout: 25000,
  });
  assert.match(stdout, /PTY smoke tests passed/);
});
