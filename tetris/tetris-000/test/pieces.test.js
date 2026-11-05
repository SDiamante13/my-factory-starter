import assert from 'node:assert/strict';
import test from 'node:test';
import { createBoard, renderBoard } from '../src/board.js';
import { spawnPiece, TETROMINOES } from '../src/pieces.js';
import { renderShell } from '../src/shell.js';

const silhouettes = {
  I: ['####'],
  O: ['##', '##'],
  T: ['.#.', '###'],
  S: ['.##', '##.'],
  Z: ['##.', '.##'],
  J: ['#..', '###'],
  L: ['..#', '###'],
};

test('all seven tetrominoes have the expected four-cell shape and centered spawn', () => {
  assert.deepEqual(Object.keys(TETROMINOES).sort(), Object.keys(silhouettes).sort());
  for (const [type, rows] of Object.entries(silhouettes)) {
    const piece = spawnPiece(type);
    const expected = rows.flatMap((row, y) => [...row].flatMap((cell, x) =>
      cell === '#' ? [[x, y]] : []));
    assert.equal(piece.type, type);
    assert.deepEqual(piece.cells, expected);
    assert.equal(new Set(piece.cells.map(String)).size, 4);
    assert.equal(piece.x, Math.floor((10 - rows[0].length) / 2));
    assert.equal(piece.y, 0);
    assert.ok(piece.cells.every(([x, y]) =>
      x + piece.x >= 0 && x + piece.x < 10 && y + piece.y >= 0 && y + piece.y < 20));
  }
});

test('spawned pieces have independent cell coordinates', () => {
  const piece = spawnPiece('T');
  piece.cells[0][0] = 99;
  assert.equal(spawnPiece('T').cells[0][0], 1);
  assert.throws(() => spawnPiece('invalid'), RangeError);
});

test('active piece overlays the board without changing settled cells or display height', () => {
  for (const type of Object.keys(silhouettes)) {
    const board = createBoard();
    board[19][0] = 'J';
    const before = structuredClone(board);
    const activePiece = spawnPiece(type);
    const rows = renderBoard(board, activePiece).split('\n');
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        const occupied = board[y][x] || activePiece.cells.some(([dx, dy]) =>
          x === activePiece.x + dx && y === activePiece.y + dy);
        assert.equal(rows[y + 1].slice(1 + x * 2, 3 + x * 2), occupied ? '[]' : '  ');
      }
    }
    assert.deepEqual(board, before);
    assert.equal(renderShell({ board, activePiece }).split('\n').length, 24);
  }
});

test('default shell displays a spawned piece', () => {
  assert.equal((renderShell().match(/\[\]/g) || []).length, 4);
});
