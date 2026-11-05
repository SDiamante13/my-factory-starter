import assert from 'node:assert/strict';
import test from 'node:test';
import { PassThrough } from 'node:stream';
import { clearFullRows, createBoard } from '../src/board.js';
import { stepDown } from '../src/gravity.js';
import { renderShell, startShell } from '../src/shell.js';

test('clears separated full rows, preserving remaining row order and input', () => {
  const board = createBoard();
  board[19].fill('T');
  board[17].fill('I');
  board[18][2] = 'O';
  board[16][3] = 'S';
  const original = structuredClone(board);
  const result = clearFullRows(board);
  assert.equal(result.clearedLines, 2);
  assert.equal(result.board.length, 20);
  assert.equal(result.board[19][2], 'O');
  assert.equal(result.board[18][3], 'S');
  assert.deepEqual(result.board.slice(0, 2), createBoard().slice(0, 2));
  assert.notEqual(result.board[0], result.board[1]);
  assert.deepEqual(board, original);
  assert.equal(clearFullRows(createBoard()).clearedLines, 0);
});

for (const count of [1, 2, 3, 4]) {
  test(`locking clears ${count} simultaneous rows and accumulates totals`, () => {
    const board = createBoard();
    board[0][0] = 'T';
    for (let y = 20 - count; y < 20; y++) {
      board[y].fill('O');
      board[y][4] = null;
    }
    const piece = { type: 'I', x: 4, y: 16, cells: [[0, 0], [0, 1], [0, 2], [0, 3]] };
    const state = stepDown(board, piece, { score: 1000, lines: 10 });
    assert.equal(state.score, 1000 + [0, 100, 300, 500, 800][count]);
    assert.equal(state.lines, 10 + count);
    assert.equal(state.board[count][0], 'T');
    assert.equal(state.board.flat().filter(Boolean).length, 5 - count);
    assert.ok(state.activePiece);
    const next = stepDown(state.board, state.activePiece, state);
    assert.equal(next.score, state.score);
    assert.equal(next.lines, state.lines);
    assert.equal(board[19][4], null);
  });
}

test('soft drop renders updated totals within 24 rows', () => {
  const board = createBoard();
  board[19].fill('T');
  board[19].fill(null, 3, 7);
  const activePiece = { type: 'I', x: 3, y: 19, cells: [[0, 0], [1, 0], [2, 0], [3, 0]] };
  const input = new PassThrough();
  const frames = [];
  const stop = startShell({ board, activePiece, input, output: { write: frame => frames.push(frame) } });
  try {
    input.write('\x1b[B');
    assert.match(frames.at(-1), /^TETRIS Score: 100 Lines: 1\n/);
    for (const frame of frames) assert.equal(frame.split('\n').length, 24);
    assert.equal(renderShell({ score: 123456, lines: 123 }).split('\n').length, 24);
  } finally {
    stop();
    input.destroy();
  }
});
