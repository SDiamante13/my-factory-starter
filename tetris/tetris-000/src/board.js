export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export function createBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}

export function clearFullRows(board) {
  const remaining = board.filter(row => !row.every(Boolean));
  const clearedLines = board.length - remaining.length;
  return {
    board: clearedLines
      ? [...Array.from({ length: clearedLines }, () => Array(BOARD_WIDTH).fill(null)), ...remaining]
      : board,
    clearedLines,
  };
}

export function renderBoard(board = createBoard(), activePiece = null) {
  const activeCells = new Set(activePiece
    ? activePiece.cells.map(([x, y]) => `${activePiece.x + x},${activePiece.y + y}`)
    : []);
  const border = '+' + '-'.repeat(BOARD_WIDTH * 2) + '+';
  return [
    border,
    ...board.map((row, y) => '|' + row.map((cell, x) =>
      cell || activeCells.has(`${x},${y}`) ? '[]' : '  ').join('') + '|'),
    border,
  ].join('\n');
}
