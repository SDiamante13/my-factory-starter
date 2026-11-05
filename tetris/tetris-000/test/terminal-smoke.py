"""Real PTY coverage using only Python's standard library (Linux/macOS)."""
import errno
import fcntl
import os
import pty
import re
import select
import signal
import struct
import subprocess
import termios
import time

ANSI = re.compile(r'\x1b\[[?\d;]*[a-zA-Z]')


class Game:
    def __init__(self):
        self.master, self.slave = pty.openpty()
        fcntl.ioctl(self.slave, termios.TIOCSWINSZ, struct.pack('HHHH', 24, 80, 0, 0))
        self.original = termios.tcgetattr(self.slave)
        self.output = ''
        self.frames = []
        self.child = subprocess.Popen(
            ['npm', 'start'], stdin=self.slave, stdout=self.slave, stderr=self.slave,
            start_new_session=True,
        )

    def read(self, until=None, timeout=4):
        deadline = time.monotonic() + timeout
        received = ''
        while time.monotonic() < deadline:
            if not select.select([self.master], [], [], 0.05)[0]:
                if until is None and received:
                    break
                continue
            try:
                data = os.read(self.master, 65536).decode()
            except OSError as error:
                if error.errno == errno.EIO:
                    break
                raise
            received += data
            self.output += data
            if until and until in received:
                break
        if until:
            assert until in received, repr(received)
        # Every redraw starts at home; npm's own startup output is outside
        # the game's alternate screen and is deliberately not a game frame.
        for part in received.split('\x1b[H'):
            if not part.startswith('TETRIS'):
                continue
            frame = ANSI.sub('', part).replace('\r', '')
            rows = frame.split('\n')
            assert len(rows) == 24, repr(frame)
            assert max(map(len, rows)) <= 80, repr(frame)
            assert rows[1] == rows[22] == '+' + '-' * 20 + '+'
            assert all(len(row) == 22 and row.startswith('|') and row.endswith('|')
                       for row in rows[2:22])
            self.frames.append(frame)
        return self.frames[-1] if self.frames else None

    def key(self, key):
        os.write(self.master, key)
        return self.read(timeout=0.2)

    def finish(self, key=None, sig=None):
        if key:
            os.write(self.master, key)
        if sig:
            os.killpg(self.child.pid, sig)
        self.read(until='\x1b[?1049l')
        assert self.child.wait(timeout=4) in (0, -signal.SIGTERM)
        assert '\x1b[?25h\x1b[?1049l' in self.output
        assert termios.tcgetattr(self.slave) == self.original, 'terminal mode not restored'

    def close(self):
        if self.child.poll() is None:
            os.killpg(self.child.pid, signal.SIGKILL)
            self.child.wait()
        os.close(self.master)
        os.close(self.slave)


def cells(frame):
    return {(x, y) for y, row in enumerate(frame.split('\n')[2:22])
            for x in range(10) if row[1 + 2 * x:3 + 2 * x] == '[]'}


game = Game()
try:
    initial = game.read(until='Ctrl+C')
    assert '\x1b[?1049h\x1b[?25l' in game.output
    assert len(cells(initial)) == 4
    raw = termios.tcgetattr(game.slave)
    assert not raw[3] & (termios.ICANON | termios.ECHO)
    left = game.key(b'\x1b[D')
    assert cells(left) == {(x - 1, y) for x, y in cells(initial)}
    right = game.key(b'\x1b[C')
    assert cells(right) == cells(initial)
    down = game.key(b'\x1b[B')
    assert cells(down) == {(x, y + 1) for x, y in cells(right)}
    rotated = game.key(b'\x1b[A')
    assert len(cells(rotated)) == 4  # O rotations may leave the frame unchanged.
    paused = game.key(b'p')
    assert 'PAUSED' in paused
    count = len(game.frames)
    os.write(game.master, b'\x1b[D\x1b[A\x1b[B ')
    game.read(timeout=1.2)
    assert len(game.frames) == count, 'paused game responded to controls/gravity'
    resumed = game.key(b'p')
    assert 'PAUSED' not in resumed
    fallen = game.read(timeout=1.5)
    assert cells(fallen) != cells(resumed), 'gravity did not advance the piece'
    dropped = game.key(b' ')
    assert len(cells(dropped)) == 8
    for _ in range(40):
        if 'GAME OVER' in game.frames[-1]:
            break
        game.key(b' ')
    assert 'GAME OVER' in game.frames[-1]
    count = len(game.frames)
    game.key(b'\x1b[D')
    assert len(game.frames) == count
    restarted = game.key(b'r')
    assert 'GAME OVER' not in restarted
    assert 'Score: 0 Lines: 0' in restarted
    assert len(cells(restarted)) == 4
    game.finish(key=b'q')
finally:
    game.close()

for exit_method in ('ctrl-c', 'sigterm'):
    game = Game()
    try:
        game.read(until='Ctrl+C')
        game.finish(key=b'\x03' if exit_method == 'ctrl-c' else None,
                    sig=signal.SIGTERM if exit_method == 'sigterm' else None)
    finally:
        game.close()

print('PTY smoke tests passed: startup, controls, 24-row frames, cleanup')
