import { BOARD_WIDTH, BOARD_HEIGHT } from './board.js';

// Spawn orientations, stored as occupied [column, row] offsets.
export const TETROMINOES = {
  I: [[0, 0], [1, 0], [2, 0], [3, 0]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

// Each bag contains all seven types exactly once (Fisher–Yates shuffle).
export function createPieceBag(random = Math.random) {
  let bag = [];
  return function nextPiece() {
    if (bag.length === 0) {
      bag = Object.keys(TETROMINOES);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    return spawnPiece(bag.pop());
  };
}

export function canPlacePiece(board, piece) {
  return piece.cells.every(([dx, dy]) => {
    const x = piece.x + dx;
    const y = piece.y + dy;
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT && !board[y][x];
  });
}

export function movePiece(board, piece, dx) {
  const moved = { ...piece, x: piece.x + dx };
  return canPlacePiece(board, moved) ? moved : piece;
}

// Clockwise rotation in a fixed 3×3 frame (4×4 for I). O never changes.
// Try small horizontal kicks only; floors and stacks still block rotation.
export function rotatePiece(board, piece) {
  if (piece.type === 'O') return piece;
  const size = piece.type === 'I' ? 4 : 3;
  const cells = piece.cells.map(([x, y]) => [size - 1 - y, x]);
  // The spawn I occupies the top edge, so its vertical form can need 3 cells.
  const kicks = piece.type === 'I' ? [0, -1, 1, -2, 2, -3, 3] : [0, -1, 1, -2, 2];
  for (const dx of kicks) {
    const rotated = { ...piece, x: piece.x + dx, cells };
    if (canPlacePiece(board, rotated)) return rotated;
  }
  return piece;
}

export function spawnPiece(type = 'T') {
  if (!Object.hasOwn(TETROMINOES, type)) {
    throw new RangeError(`Unknown tetromino: ${type}`);
  }
  const cells = TETROMINOES[type].map(cell => [...cell]);
  const width = Math.max(...cells.map(([x]) => x)) + 1;
  return { type, x: Math.floor((BOARD_WIDTH - width) / 2), y: 0, cells };
}
