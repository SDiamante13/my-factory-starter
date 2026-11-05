import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import test from 'node:test';
import { PassThrough } from 'node:stream';
import { renderShell, startShell } from '../src/shell.js';

test('shell fits within 24 terminal rows', () => {
  const display = renderShell();
  assert.equal(display.split('\n').length, 24);
  assert.ok(display.split('\n').every(row => row.length <= 24));
  assert.match(display, /TETRIS/);
  assert.match(display, /Score: 0/);
  assert.match(display, /Ctrl\+C/);
});

test('terminal state is restored when stopped, exactly once', () => {
  let display = '';
  let paused = false;
  const input = new PassThrough();
  input.isTTY = true;
  input.isRaw = false;
  const rawModes = [];
  input.setRawMode = value => { input.isRaw = value; rawModes.push(value); };
  input.on('pause', () => { paused = true; });
  const stop = startShell({
    input,
    output: { isTTY: true, write(text) { display += text; } },
  });
  try {
    assert.ok(display.startsWith('\x1b[?1049h\x1b[?25l'));
    const visible = display.replace(/\x1b\[[?\d;]*[a-zA-Z]/g, '');
    assert.equal(visible, renderShell());
    assert.equal(visible.split('\n').length, 24);
    stop();
    const afterStop = display;
    stop();
    assert.equal(display, afterStop);
    assert.ok(display.endsWith('\x1b[?25h\x1b[?1049l'));
    assert.ok(paused);
    assert.deepEqual(rawModes, [true, false]);
    assert.equal(input.listenerCount('keypress'), 0);
  } finally {
    stop();
  }
});

test('application exits cleanly on Ctrl+C signal', { timeout: 5000 }, async () => {
  const child = spawn(process.execPath, ['src/index.js'], { stdio: ['pipe', 'pipe', 'pipe'] });
  try {
    const exited = once(child, 'exit');
    const [output] = await once(child.stdout, 'data');
    assert.match(output.toString(), /TETRIS/);
    child.kill('SIGINT');
    const [code, signal] = await exited;
    assert.equal(code, 0);
    assert.equal(signal, null);
  } finally {
    if (child.exitCode === null) child.kill('SIGKILL');
  }
});
