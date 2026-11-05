import assert from 'node:assert/strict';
import test from 'node:test';
import { PassThrough } from 'node:stream';
import { createBoard } from '../src/board.js';
import { canPlacePiece, movePiece, rotatePiece, spawnPiece, TETROMINOES } from '../src/pieces.js';
import { renderShell, startShell } from '../src/shell.js';

const sortedCells = piece => piece.cells.map(cell => cell.join(',')).sort();

test('all shapes rotate clockwise and return after four turns without mutation', () => {
  const board = createBoard();
  for (const type of Object.keys(TETROMINOES)) {
    const original = spawnPiece(type);
    const snapshot = structuredClone(original);
    let piece = original;
    for (let turn = 0; turn < 4; turn++) {
      piece = rotatePiece(board, piece);
      assert.ok(canPlacePiece(board, piece));
      assert.equal(new Set(sortedCells(piece)).size, 4);
      assert.equal(piece.x, original.x);
      assert.equal(piece.y, original.y);
    }
    assert.deepEqual(sortedCells(piece), sortedCells(original));
    assert.deepEqual(original, snapshot);
  }
  assert.deepEqual(rotatePiece(board, spawnPiece('T')).cells, [[2, 1], [1, 0], [1, 1], [1, 2]]);
  const square = spawnPiece('O');
  assert.equal(rotatePiece(board, square), square);
});

test('vertical I rotates away from either wall using horizontal kicks', () => {
  const board = createBoard();
  for (const direction of [-1, 1]) {
    let piece = rotatePiece(board, spawnPiece('I'));
    if (direction === 1) piece = rotatePiece(board, rotatePiece(board, piece));
    while (movePiece(board, piece, direction) !== piece) piece = movePiece(board, piece, direction);
    const rotated = rotatePiece(board, piece);
    assert.notEqual(rotated, piece);
    assert.notEqual(rotated.x, piece.x);
    assert.equal(rotated.y, piece.y);
    assert.ok(canPlacePiece(board, rotated));
  }
});

test('stack collisions trigger a kick or reject every candidate without mutation', () => {
  const board = createBoard();
  const piece = spawnPiece('T');
  board[2][piece.x + 1] = 'J';
  const kicked = rotatePiece(board, piece);
  assert.equal(kicked.x, piece.x - 1);
  assert.ok(canPlacePiece(board, kicked));
  board[2].fill('J');
  const snapshot = structuredClone(board);
  assert.equal(rotatePiece(board, piece), piece);
  assert.deepEqual(board, snapshot);
});

test('walls and floor reject rotations when horizontal kicks cannot help', () => {
  const board = createBoard();
  let piece = rotatePiece(board, spawnPiece('I'));
  while (movePiece(board, piece, -1) !== piece) piece = movePiece(board, piece, -1);
  board[3].fill('J');
  board[3][0] = null; // Leave the current vertical piece valid.
  assert.ok(canPlacePiece(board, piece));
  assert.equal(rotatePiece(board, piece), piece);
  const grounded = { ...spawnPiece('T'), y: 18 };
  assert.ok(canPlacePiece(createBoard(), grounded));
  assert.equal(rotatePiece(createBoard(), grounded), grounded);
});

test('raw up arrow rotates and redraws within the 24-row display', () => {
  const input = new PassThrough();
  const frames = [];
  const stop = startShell({ activePiece: spawnPiece(), input, output: { write: text => frames.push(text) } });
  try {
    input.write('\x1b[A');
    const expected = renderShell({ activePiece: rotatePiece(createBoard(), spawnPiece()) });
    assert.equal(frames.at(-1), expected);
    assert.equal(expected.split('\n').length, 24);
    assert.ok(expected.split('\n').every(row => row.length <= 24));
    assert.match(expected, /↑/);
  } finally {
    stop();
    input.destroy();
  }
});
