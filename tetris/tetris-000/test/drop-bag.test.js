import assert from 'node:assert/strict';
import test from 'node:test';
import { PassThrough } from 'node:stream';
import { createBoard } from '../src/board.js';
import { createPieceBag, spawnPiece, TETROMINOES } from '../src/pieces.js';
import { hardDrop } from '../src/gravity.js';
import { renderShell, startShell } from '../src/shell.js';

test('successive bags each contain all seven types and are shuffled', () => {
  const types = Object.keys(TETROMINOES).sort();
  const next = createPieceBag(() => 0);
  for (let bag = 0; bag < 4; bag++) {
    const pieces = Array.from({ length: 7 }, () => next());
    assert.deepEqual(pieces.map(piece => piece.type).sort(), types);
    assert.deepEqual(pieces[0], spawnPiece('I'));
  }
  const other = createPieceBag(() => 0.999);
  assert.equal(other().type, 'L');
});

test('hard drop locks every shape on the floor and consumes one next piece', () => {
  for (const type of Object.keys(TETROMINOES)) {
    const board = createBoard();
    const piece = spawnPiece(type);
    let calls = 0;
    const state = hardDrop(board, piece, { nextPiece: () => { calls++; return spawnPiece('Z'); } });
    const bottom = Math.max(...piece.cells.map(([, y]) => y));
    for (const [x, y] of piece.cells) assert.equal(state.board[19 - bottom + y][piece.x + x], type);
    assert.equal(calls, 1);
    assert.deepEqual(state.activePiece, spawnPiece('Z'));
    assert.equal(board.flat().filter(Boolean).length, 0);
    assert.equal(piece.y, 0);
  }
});

test('hard drop stops on stacks and clears rows with normal scoring', () => {
  const board = createBoard();
  board[19][4] = 'J';
  const stacked = hardDrop(board, spawnPiece('O'));
  assert.equal(stacked.board[17][4], 'O');
  assert.equal(stacked.board[18][4], 'O');
  assert.equal(stacked.board[19][4], 'J');
  const full = createBoard();
  full[19].fill('J');
  full[19].fill(null, 3, 7);
  const cleared = hardDrop(full, spawnPiece('I'), { score: 20, lines: 2 });
  assert.equal(cleared.score, 120);
  assert.equal(cleared.lines, 3);
  assert.equal(cleared.board.flat().filter(Boolean).length, 0);
  assert.deepEqual(hardDrop(full, null), { board: full, activePiece: null, score: 0, lines: 0 });
});

test('Space drops immediately and shell spawns from the same bag', () => {
  const input = new PassThrough();
  const frames = [];
  const nextPiece = createPieceBag(() => 0);
  const first = nextPiece();
  const stop = startShell({ input, nextPiece: createPieceBag(() => 0), output: { write: frame => frames.push(frame) } });
  try {
    assert.equal(frames[0], renderShell({ activePiece: first }));
    input.write(' ');
    const expected = hardDrop(createBoard(), first, { nextPiece });
    assert.equal(frames.at(-1), renderShell(expected));
    assert.equal(frames.length, 2);
    assert.match(frames[0], /Space/);
    for (const frame of frames) assert.equal(frame.split('\n').length, 24);
  } finally {
    stop();
    input.destroy();
  }
});
