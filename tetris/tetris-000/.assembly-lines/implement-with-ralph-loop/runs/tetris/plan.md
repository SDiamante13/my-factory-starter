# Terminal Tetris implementation plan

- [x] Set up a Node.js project with `npm start` that displays a terminal game shell and exits cleanly with Ctrl+C; keep its entire display within 24 rows.
- [x] Add a 10-column, 20-row empty board renderer with borders, score, and a compact controls legend, with tests confirming the complete display never exceeds 24 rows.
- [x] Define all seven tetrominoes and add spawning and active-piece rendering on the board, with tests for piece shapes and spawn positions.
- [x] Add raw keyboard input for left and right movement, enforce board and occupied-cell collisions, and restore terminal settings on exit; test movement boundaries.
- [x] Add timed gravity and soft drop, locking pieces when they land and spawning the next piece; test landing and stacking behavior.
- [x] Add keyboard rotation with collision checks and simple wall kicks, with tests covering successful rotations and blocked rotations near walls and stacks.
- [x] Clear completed rows after locking, collapse the remaining board, and update the displayed score and line count; test single and multiple simultaneous line clears.
- [x] Add hard drop and a shuffled seven-piece bag, update the controls legend, and test drop placement and bag contents.
- [x] Add pause/resume, spawn-blocked game over, restart, and a quit key, keeping all status messages within the existing 24-row display; test these state transitions.
- [ ] Add end-to-end terminal smoke tests for `npm start`, keyboard controls, display height across gameplay states, and terminal cleanup; document startup and controls and fix any issues found.
