import { emitKeypressEvents } from 'node:readline';
import { createBoard, renderBoard } from './board.js';
import { createPieceBag, movePiece, rotatePiece, spawnPiece } from './pieces.js';
import { hardDrop, stepDown } from './gravity.js';

export function renderShell({ board = createBoard(), activePiece = spawnPiece(), score = 0, lines = 0 } = {}) {
  return [
    `TETRIS Score: ${score} Lines: ${lines}`,
    renderBoard(board, activePiece),
    '←→ ↑ ↓ Space:drop Ctrl+C',
  ].join('\n');
}

export function startShell({
  input = process.stdin,
  output = process.stdout,
  board = createBoard(),
  nextPiece = createPieceBag(),
  activePiece = nextPiece(),
  gravityMs = 1000,
  score = 0,
  lines = 0,
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
    if (key?.name === 'space') {
      if (!activePiece) return;
      ({ board, activePiece, score, lines } = hardDrop(board, activePiece, { score, lines, nextPiece }));
      draw();
      return;
    }
    if (key?.name === 'down') {
      descend();
      return;
    }
    if (key?.name === 'up') {
      if (!activePiece) return;
      const rotated = rotatePiece(board, activePiece);
      if (rotated !== activePiece) {
        activePiece = rotated;
        draw();
      }
      return;
    }
    const dx = key?.name === 'left' ? -1 : key?.name === 'right' ? 1 : 0;
    if (!dx || !activePiece) return;
    const moved = movePiece(board, activePiece, dx);
    if (moved === activePiece) return;
    activePiece = moved;
    draw();
  }
  function draw() {
    output.write((terminal ? '\x1b[H' : '') + renderShell({ board, activePiece, score, lines }));
  }
  function descend() {
    if (!activePiece) return;
    ({ board, activePiece, score, lines } = stepDown(board, activePiece, { score, lines, nextPiece }));
    draw();
  }
  input.on('keypress', onKeypress);

  const gravity = setInterval(descend, gravityMs);
  input.resume();
  let stopped = false;
  function stop() {
    if (stopped) return;
    stopped = true;
    clearInterval(gravity);
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
  output.write(renderShell({ board, activePiece, score, lines }));
  return stop;
}
