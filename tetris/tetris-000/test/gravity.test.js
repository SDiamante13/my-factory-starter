import assert from 'node:assert/strict';
import test from 'node:test';
import { PassThrough } from 'node:stream';
import { createBoard } from '../src/board.js';
import { canPlacePiece, spawnPiece, TETROMINOES } from '../src/pieces.js';
import { stepDown } from '../src/gravity.js';
import { renderShell, startShell } from '../src/shell.js';

test('gravity moves each shape down, then locks on the floor and spawns', () => {
  for (const type of Object.keys(TETROMINOES)) {
    const board = createBoard();
    const original = spawnPiece(type);
    let state = stepDown(board, original);
    assert.equal(state.activePiece.y, 1);
    assert.equal(state.board, board);
    const height = Math.max(...original.cells.map(([, y]) => y)) + 1;
    for (let i = 1; i < 20 - height; i++) state = stepDown(state.board, state.activePiece);
    const landed = state.activePiece;
    assert.equal(landed.y, 20 - height);
    state = stepDown(state.board, landed);
    assert.deepEqual(state.activePiece, spawnPiece());
    assert.equal(state.board.flat().filter(Boolean).length, 4);
    for (const [x, y] of landed.cells) assert.equal(state.board[y + landed.y][x + landed.x], type);
    assert.equal(board.flat().filter(Boolean).length, 0);
    assert.equal(original.y, 0);
  }
});

test('pieces land on existing stacks without overwriting them', () => {
  let state = { board: createBoard(), activePiece: spawnPiece('O') };
  state.activePiece.y = 18;
  state = stepDown(state.board, state.activePiece);
  const bottom = structuredClone(state.board.slice(18));
  state.activePiece = { ...spawnPiece('O'), y: 15 };
  state = stepDown(state.board, state.activePiece);
  assert.equal(state.activePiece.y, 16);
  assert.ok(canPlacePiece(state.board, state.activePiece));
  state = stepDown(state.board, state.activePiece);
  assert.equal(state.board.flat().filter(Boolean).length, 8);
  assert.deepEqual(state.board.slice(18), bottom);
});

test('blocked spawn leaves the stack intact and no active piece', () => {
  const board = createBoard();
  board[0][4] = 'I';
  const piece = { ...spawnPiece('O'), y: 18 };
  const state = stepDown(board, piece);
  assert.equal(state.activePiece, null);
  assert.equal(state.board[0][4], 'I');
  assert.deepEqual(stepDown(state.board, null), state);
});

test('Down arrow and timer both descend; stopping cancels gravity', async () => {
  const input = new PassThrough();
  const frames = [];
  const stop = startShell({ input, gravityMs: 20, output: { write: frame => frames.push(frame) } });
  try {
    input.write('\x1b[B');
    assert.equal(frames.at(-1), renderShell({ activePiece: { ...spawnPiece(), y: 1 } }));
    await new Promise(resolve => setTimeout(resolve, 55));
    assert.ok(frames.length >= 3);
    const count = frames.length;
    stop();
    await new Promise(resolve => setTimeout(resolve, 40));
    assert.equal(frames.length, count);
    for (const frame of frames) assert.equal(frame.split('\n').length, 24);
  } finally {
    stop();
    input.destroy();
  }
});
