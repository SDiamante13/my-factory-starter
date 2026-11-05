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

export function spawnPiece(type = 'T') {
  if (!Object.hasOwn(TETROMINOES, type)) {
    throw new RangeError(`Unknown tetromino: ${type}`);
  }
  const cells = TETROMINOES[type].map(cell => [...cell]);
  const width = Math.max(...cells.map(([x]) => x)) + 1;
  return { type, x: Math.floor((BOARD_WIDTH - width) / 2), y: 0, cells };
}
