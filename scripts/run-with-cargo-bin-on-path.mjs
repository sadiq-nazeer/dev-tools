/**
 * Prepends ~/.cargo/bin to PATH before spawning a command.
 * Fixes "cargo ... program not found" when the IDE terminal inherits a PATH
 * without rustup's shim directory (common with Cursor on Windows).
 */
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const [, , cmd, ...cmdArgs] = process.argv;

if (!cmd) {
  console.error('Usage: node scripts/run-with-cargo-bin-on-path.mjs <command> [args...]');
  process.exit(1);
}

const cargoBin = join(homedir(), '.cargo', 'bin');
const sep = process.platform === 'win32' ? ';' : ':';
const prevPath = process.env.PATH ?? process.env.Path ?? '';
const env = {
  ...process.env,
  PATH: `${cargoBin}${sep}${prevPath}`,
};

const child = spawnSync(cmd, cmdArgs, {
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(child.status === null ? 1 : child.status);
