import assert from 'node:assert/strict';
import test from 'node:test';
import { PassThrough } from 'node:stream';
import { createBoard } from '../src/board.js';
import { canPlacePiece, movePiece, spawnPiece, TETROMINOES } from '../src/pieces.js';
import { renderShell, startShell } from '../src/shell.js';

test('every shape moves left and right but cannot cross either wall', () => {
  const board = createBoard();
  for (const type of Object.keys(TETROMINOES)) {
    const original = spawnPiece(type);
    const snapshot = structuredClone(original);
    assert.equal(movePiece(board, original, -1).x, original.x - 1);
    assert.equal(movePiece(board, original, 1).x, original.x + 1);
    let piece = original;
    while (movePiece(board, piece, -1) !== piece) piece = movePiece(board, piece, -1);
    assert.equal(piece.x, 0);
    assert.ok(canPlacePiece(board, piece));
    while (movePiece(board, piece, 1) !== piece) piece = movePiece(board, piece, 1);
    assert.equal(Math.max(...piece.cells.map(([x]) => x + piece.x)), 9);
    assert.ok(canPlacePiece(board, piece));
    assert.deepEqual(original, snapshot);
  }
});

test('occupied cells block horizontal movement without changing the board', () => {
  const board = createBoard();
  const piece = spawnPiece('O');
  board[1][piece.x - 1] = 'T';
  board[0][piece.x + 2] = 'J';
  const snapshot = structuredClone(board);
  assert.equal(movePiece(board, piece, -1), piece);
  assert.equal(movePiece(board, piece, 1), piece);
  assert.deepEqual(board, snapshot);
  assert.equal(canPlacePiece(board, { ...piece, y: -1 }), false);
  assert.equal(canPlacePiece(board, { ...piece, y: 19 }), false);
});

test('raw arrow sequences redraw the moved piece and raw Ctrl+C restores input', async () => {
  const input = new PassThrough();
  input.isTTY = true;
  input.isRaw = true;
  input.setRawMode = value => { input.isRaw = value; };
  const frames = [];
  const stop = startShell({ activePiece: spawnPiece(), input, output: { isTTY: true, write: text => frames.push(text) } });
  try {
    input.write('\x1b[D');
    input.write('\x1b[C');
    await new Promise(resolve => setImmediate(resolve));
    const moved = spawnPiece();
    moved.x--;
    assert.equal(frames[2], '\x1b[H' + renderShell({ activePiece: moved }) + '\x1b[J');
    assert.equal(frames[3], '\x1b[H' + renderShell() + '\x1b[J');
    input.write('\x03');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(input.isRaw, true); // Preserve pre-existing raw mode.
    assert.equal(input.listenerCount('keypress'), 0);
    assert.equal(frames.at(-1), '\x1b[?25h\x1b[?1049l');
    const count = frames.length;
    input.emit('keypress', '', { name: 'left' });
    assert.equal(frames.length, count);
  } finally {
    stop();
    input.destroy();
  }
});
