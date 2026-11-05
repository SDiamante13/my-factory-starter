export function renderShell() {
  return [
    'TETRIS',
    'Score: 0',
    'Ready — game coming soon',
    'Controls: Ctrl+C to quit',
  ].join('\n');
}

export function startShell({ input = process.stdin, output = process.stdout } = {}) {
  const terminal = Boolean(output.isTTY);
  if (terminal) output.write('\x1b[?1049h\x1b[?25l\x1b[2J\x1b[H');
  output.write(renderShell() + '\n');

  // Keep the shell running even when standard input is redirected.
  const keepAlive = setInterval(() => {}, 1000);
  input.resume();
  let stopped = false;
  function stop() {
    if (stopped) return;
    stopped = true;
    clearInterval(keepAlive);
    input.pause();
    if (terminal) output.write('\x1b[?25h\x1b[?1049l');
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
    process.removeListener('exit', stop);
  }
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  process.on('exit', stop);
  return stop;
}
