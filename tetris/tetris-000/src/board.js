export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export function createBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}

export function renderBoard(board = createBoard()) {
  const border = '+' + '-'.repeat(BOARD_WIDTH * 2) + '+';
  return [
    border,
    ...board.map(row => '|' + row.map(cell => cell ? '[]' : '  ').join('') + '|'),
    border,
  ].join('\n');
}
