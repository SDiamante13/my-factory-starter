import assert from 'node:assert/strict';
import test from 'node:test';
import { BOARD_WIDTH, BOARD_HEIGHT, createBoard, renderBoard } from '../src/board.js';

test('empty board has 20 independent rows of 10 empty cells', () => {
  const board = createBoard();
  assert.equal(BOARD_WIDTH, 10);
  assert.equal(BOARD_HEIGHT, 20);
  assert.equal(board.length, 20);
  for (const row of board) {
    assert.deepEqual(row, Array(10).fill(null));
  }
  board[0][0] = 'T';
  assert.equal(board[1][0], null);
});

test('empty board renders 20 rows enclosed by borders', () => {
  const rows = renderBoard().split('\n');
  assert.equal(rows.length, 22);
  assert.equal(rows[0], '+' + '-'.repeat(20) + '+');
  assert.equal(rows[21], rows[0]);
  assert.deepEqual(rows.slice(1, -1), Array(20).fill('|' + '  '.repeat(10) + '|'));
});
