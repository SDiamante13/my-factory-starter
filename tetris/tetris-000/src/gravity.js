import { canPlacePiece, spawnPiece } from './pieces.js';

// One gravity tick or soft drop. Lock immediately when downward motion fails.
export function stepDown(board, activePiece) {
  if (!activePiece) return { board, activePiece };
  const lowered = { ...activePiece, y: activePiece.y + 1 };
  if (canPlacePiece(board, lowered)) return { board, activePiece: lowered };

  const lockedBoard = board.map(row => [...row]);
  for (const [dx, dy] of activePiece.cells) {
    lockedBoard[activePiece.y + dy][activePiece.x + dx] = activePiece.type;
  }
  const next = spawnPiece();
  // Never overwrite a full stack; game-over handling will build on this state.
  return { board: lockedBoard, activePiece: canPlacePiece(lockedBoard, next) ? next : null };
}
