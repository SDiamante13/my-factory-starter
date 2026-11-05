import assert from 'node:assert/strict';
import test from 'node:test';
import { PassThrough } from 'node:stream';
import { createBoard } from '../src/board.js';
import { spawnPiece } from '../src/pieces.js';
import { renderShell, startShell } from '../src/shell.js';

function shell(options = {}) {
  const input = new PassThrough();
  const frames = [];
  const stop = startShell({
    input,
    output: { write: frame => frames.push(frame) },
    nextPiece: () => spawnPiece('O'),
    gravityMs: 10000,
    ...options,
  });
  return { input, frames, close() { stop(); input.destroy(); } };
}

test('pause freezes gravity and gameplay controls, and resumes on P', async () => {
  const game = shell({ gravityMs: 10 });
  try {
    game.input.write('p');
    assert.match(game.frames.at(-1), /PAUSED/);
    const count = game.frames.length;
    game.input.write('\x1b[D\x1b[C\x1b[A\x1b[B ');
    await new Promise(resolve => setTimeout(resolve, 35));
    assert.equal(game.frames.length, count);
    game.input.write('p');
    assert.equal(game.frames.at(-1), renderShell({ activePiece: spawnPiece('O') }));
    await new Promise(resolve => setTimeout(resolve, 25));
    assert.ok(game.frames.length > count + 1);
  } finally {
    game.close();
  }
});

test('blocked next spawn shows game over, ignores gameplay, and restarts cleanly', () => {
  const board = createBoard();
  board[0][4] = 'I';
  const game = shell({ board, activePiece: { ...spawnPiece('O'), y: 18 }, score: 300, lines: 2 });
  try {
    game.input.write(' ');
    assert.equal(game.frames.at(-1), renderShell({
      board: board.map((row, y) => row.map((cell, x) => y >= 18 && (x === 4 || x === 5) ? 'O' : cell)),
      activePiece: null, score: 300, lines: 2,
    }));
    assert.match(game.frames.at(-1), /GAME OVER/);
    const count = game.frames.length;
    game.input.write('p\x1b[D\x1b[C\x1b[A\x1b[B ');
    assert.equal(game.frames.length, count);
    game.input.write('r');
    assert.equal(game.frames.at(-1), renderShell({ activePiece: spawnPiece('O') }));
    game.input.write('\x1b[B');
    assert.equal(game.frames.at(-1), renderShell({ activePiece: { ...spawnPiece('O'), y: 1 } }));
  } finally {
    game.close();
  }
});

test('an initially blocked spawn is game over; restart also works while paused', () => {
  const board = createBoard();
  board[0][4] = 'T';
  const game = shell({ board });
  try {
    assert.match(game.frames.at(-1), /GAME OVER/);
    game.input.write('rp');
    assert.match(game.frames.at(-1), /PAUSED/);
    game.input.write('r');
    assert.equal(game.frames.at(-1), renderShell({ activePiece: spawnPiece('O') }));
  } finally {
    game.close();
  }
});

test('quit restores terminal settings in playing, paused, and game-over states', () => {
  for (const keys of ['', 'p', null]) {
    const input = new PassThrough();
    input.isTTY = true;
    input.isRaw = false;
    input.setRawMode = value => { input.isRaw = value; };
    const game = shell({ input, ...(keys === null ? { activePiece: null } : {}) });
    try {
      if (keys) input.write(keys);
      input.write('q');
      assert.equal(input.isRaw, false);
      assert.equal(input.listenerCount('keypress'), 0);
      assert.equal(input.isPaused(), true);
    } finally {
      game.close();
    }
  }
});

test('all status displays stay within 24 rows and 24 columns', () => {
  for (const state of [{}, { paused: true }, { activePiece: null }]) {
    const rows = renderShell(state).split('\n');
    assert.equal(rows.length, 24);
    assert.ok(rows.every(row => row.length <= 24));
  }
});
