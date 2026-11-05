# Terminal Tetris

Requires Node.js 18 or newer and an interactive terminal at least 24 rows tall
and 24 columns wide. No dependencies to install.

```sh
npm start
```

The complete game uses 24 rows, including the board, score, and status. It uses
the alternate screen and restores the cursor and terminal input mode on exit.

## Controls

| Key | Action |
| --- | --- |
| Left / Right | Move |
| Up | Rotate clockwise (with simple horizontal wall kicks) |
| Down | Soft drop |
| Space | Hard drop and lock |
| P | Pause / resume |
| R | Restart, including after game over |
| Q / Ctrl+C | Quit |

Pieces fall once per second. Each shuffled bag contains all seven tetrominoes.
Clearing 1 / 2 / 3 / 4 rows at once earns 100 / 300 / 500 / 800 points.
The game ends when the next piece cannot spawn.

## Tests

```sh
npm test
```

Unit tests cover rules and rendering. The end-to-end smoke test launches
`npm start` in a real 24-row pseudo-terminal and checks keyboard controls,
gravity, pause, game over, restart, frame height, and terminal restoration on
Q, Ctrl+C, and SIGTERM. It requires Python 3 on Linux/macOS (standard library
only); the PTY test is skipped on Windows.
