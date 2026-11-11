import test from 'node:test'
import assert from 'node:assert/strict'
import { createLinuxTerminalState, executeLinuxCommand, INITIAL_COMMANDS, tokenizeShell } from './shell.ts'
import { readVirtualFile } from './virtualFilesystem.ts'

function run(script: string, state = createLinuxTerminalState()) {
  const result = executeLinuxCommand(script, state)
  return result
}
test('22 commands in the first documented set', () => {
  assert.equal(INITIAL_COMMANDS.length, 22)
  assert.equal(new Set(INITIAL_COMMANDS).size, INITIAL_COMMANDS.length)
})
test('home directory and initial system files', () => {
  const state = createLinuxTerminalState()
  assert.equal(run('pwd', state).output[0], '/home/student')
  assert.match(run('ls', state).output[0], /welcome.txt/)
  assert.match(run('cat /etc/hostname', state).output[0], /syslab-linux/)
})
test('mkdir -p, cd, touch and ls share the same VFS', () => {
  let state = run('mkdir -p projects/demo').state
  state = run('cd projects/demo', state).state
  state = run('touch README.md', state).state
  assert.equal(state.cwd, '/home/student/projects/demo')
  assert.match(run('ls -la', state).output.join('\n'), /README.md/)
  assert.equal(readVirtualFile(state.filesystem, '/home/student/projects/demo/README.md'), '')
})
test('quoted echo and redirection create and append real virtual contents', () => {
  let state = run('echo "Hello SYS/LAB" > README.md').state
  state = run("echo 'Second line' >> README.md", state).state
  assert.equal(run('cat README.md', state).output[0], 'Hello SYS/LAB\nSecond line\n')
  assert.equal(run('wc -l README.md', state).output[0], '2 /home/student/README.md')
})
test('copy, move and remove operate on virtual files', () => {
  let state = run('echo original > a.txt').state
  state = run('cp a.txt b.txt', state).state
  state = run('mv b.txt c.txt', state).state
  assert.equal(run('cat c.txt', state).output[0], 'original\n')
  assert.equal(run('cat b.txt', state).exitCode, 1)
  state = run('rm c.txt', state).state
  assert.equal(run('cat c.txt', state).exitCode, 1)
  assert.equal(run('cat a.txt', state).exitCode, 0)
})
test('quoted parser and && command chaining', () => {
  assert.deepEqual(tokenizeShell('echo "hello world" >> log.txt && cat log.txt'),
    ['echo','hello world','>>','log.txt','&&','cat','log.txt'])
  const result = run('mkdir -p work && cd work && echo ready > status.txt && cat status.txt')
  assert.equal(result.exitCode, 0)
  assert.equal(result.output.at(-1), 'ready\n')
  assert.equal(result.state.cwd, '/home/student/work')
})
test('chain stops after error and does not run later commands', () => {
  const result = run('cd does-not-exist && touch ghost.txt')
  assert.equal(result.exitCode, 1)
  assert.equal(result.state.filesystem.nodes['/home/student/ghost.txt'], undefined)
})
test('virtual system files are read-only and root is protected', () => {
  assert.equal(run('touch /etc/secret').exitCode, 1)
  assert.equal(run('rm -r /').exitCode, 1)
  assert.equal(run('rm -r /home/student').exitCode, 1)
  assert.equal(run('cat /etc/hosts').exitCode, 0)
})
test('rmdir refuses nonempty directories', () => {
  let state = run('mkdir projects').state
  state = run('touch projects/README.md', state).state
  assert.equal(run('rmdir projects', state).exitCode, 1)
  state = run('rm projects/README.md', state).state
  state = run('rmdir projects', state).state
  assert.equal(state.filesystem.nodes['/home/student/projects'], undefined)
})
test('head, tail, grep, find, tree and stat read virtual content', () => {
  let state = run('echo "alpha" > lines.txt').state
  state = run('echo "beta" >> lines.txt', state).state
  state = run('echo "ALPHA" >> lines.txt', state).state
  assert.equal(run('head -n 1 lines.txt', state).output[0], 'alpha')
  assert.equal(run('tail -n 1 lines.txt', state).output[0], 'ALPHA')
  assert.deepEqual(run('grep -in alpha lines.txt', state).output, ['1:alpha','3:ALPHA'])
  assert.ok(run('find . -name "*.txt"', state).output.includes('/home/student/lines.txt'))
  assert.ok(run('tree', state).output.some(row => row.includes('lines.txt')))
  assert.ok(run('stat lines.txt', state).output.some(row => row.includes('Type: file')))
})
test('execution clones the input snapshot instead of mutating it', () => {
  const before = createLinuxTerminalState()
  const after = run('touch new.txt', before).state
  assert.equal(before.filesystem.nodes['/home/student/new.txt'], undefined)
  assert.equal(after.filesystem.nodes['/home/student/new.txt']?.type, 'file')
})
test('unsupported pipes fail explicitly, not as pretend Linux', () => {
  const result = run('ls | grep txt')
  assert.equal(result.exitCode, 2)
  assert.match(result.output[0], /Pipes/)
})
