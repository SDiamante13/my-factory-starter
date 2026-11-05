import { canPlacePiece, spawnPiece } from './pieces.js';
import { clearFullRows } from './board.js';

const LINE_SCORES = [0, 100, 300, 500, 800];

// Move to the lowest valid position, then use the usual lock/clear/spawn path.
export function hardDrop(board, activePiece, options = {}) {
  if (activePiece) {
    while (canPlacePiece(board, { ...activePiece, y: activePiece.y + 1 })) {
      activePiece = { ...activePiece, y: activePiece.y + 1 };
    }
  }
  return stepDown(board, activePiece, options);
}

// One gravity tick or soft drop. Lock immediately when downward motion fails.
export function stepDown(board, activePiece, { score = 0, lines = 0, nextPiece = spawnPiece } = {}) {
  if (!activePiece) return { board, activePiece, score, lines };
  const lowered = { ...activePiece, y: activePiece.y + 1 };
  if (canPlacePiece(board, lowered)) return { board, activePiece: lowered, score, lines };

  const lockedBoard = board.map(row => [...row]);
  for (const [dx, dy] of activePiece.cells) {
    lockedBoard[activePiece.y + dy][activePiece.x + dx] = activePiece.type;
  }
  const cleared = clearFullRows(lockedBoard);
  const next = nextPiece();
  // Check the spawn only after completed rows have been removed.
  return {
    board: cleared.board,
    activePiece: canPlacePiece(cleared.board, next) ? next : null,
    score: score + LINE_SCORES[cleared.clearedLines],
    lines: lines + cleared.clearedLines,
  };
}
