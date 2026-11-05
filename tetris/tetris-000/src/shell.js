import { emitKeypressEvents } from 'node:readline';
import { createBoard, renderBoard } from './board.js';
import { movePiece, spawnPiece } from './pieces.js';

export function renderShell({ board = createBoard(), activePiece = spawnPiece() } = {}) {
  return [
    'TETRIS | Score: 0',
    renderBoard(board, activePiece),
    '←/→: move | Ctrl+C: quit',
  ].join('\n');
}

export function startShell({
  input = process.stdin,
  output = process.stdout,
  board = createBoard(),
  activePiece = spawnPiece(),
} = {}) {
  const terminal = Boolean(output.isTTY);
  const wasRaw = Boolean(input.isRaw);
  emitKeypressEvents(input);
  if (input.isTTY) input.setRawMode(true);
  function onKeypress(text, key) {
    if (key?.ctrl && key.name === 'c') {
      stop();
      return;
    }
    const dx = key?.name === 'left' ? -1 : key?.name === 'right' ? 1 : 0;
    if (!dx) return;
    const moved = movePiece(board, activePiece, dx);
    if (moved === activePiece) return;
    activePiece = moved;
    output.write((terminal ? '\x1b[H' : '') + renderShell({ board, activePiece }));
  }
  input.on('keypress', onKeypress);

  // Keep the shell running even when standard input is redirected.
  const keepAlive = setInterval(() => {}, 1000);
  input.resume();
  let stopped = false;
  function stop() {
    if (stopped) return;
    stopped = true;
    clearInterval(keepAlive);
    input.removeListener('keypress', onKeypress);
    if (input.isTTY) input.setRawMode(wasRaw);
    input.pause();
    if (terminal) output.write('\x1b[?25h\x1b[?1049l');
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
    process.removeListener('exit', stop);
  }
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  process.on('exit', stop);
  // Publish the initial frame only after input and cleanup handlers are ready.
  // No trailing newline: the final legend occupies row 24 without scrolling.
  if (terminal) output.write('\x1b[?1049h\x1b[?25l\x1b[2J\x1b[H');
  output.write(renderShell({ board, activePiece }));
  return stop;
}
