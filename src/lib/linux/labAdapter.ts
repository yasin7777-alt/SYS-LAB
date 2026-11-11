/**
 * Adapter between the original three LAB scenarios and the new isolated VFS.
 * The first Linux scenario uses the new shell; the network and service labs
 * continue to use their existing state machine unchanged.
 */
import type { CommandResult, LabState } from '../labEngine.ts'
import { createLinuxTerminalState, executeLinuxCommand, type LinuxTerminalState } from './shell.ts'
import { createDirectory, writeVirtualFile } from './virtualFilesystem.ts'

export function migrateLegacyLinuxState(legacy: LabState): LinuxTerminalState {
  const fresh = createLinuxTerminalState()
  const projects = legacy.directories.includes('/home/student/projects') || legacy.readmeCreated
  if (projects) createDirectory(fresh.filesystem, '/home/student/projects', true)
  if (legacy.readmeCreated) {
    writeVirtualFile(fresh.filesystem, '/home/student/projects/README.md',
      '# SYS/LAB project\n\nBuilt, not just studied.\n')
  }
  if (legacy.cwd === '/home/student/projects' && projects) fresh.cwd = legacy.cwd
  fresh.commandCount = legacy.commandCount
  return fresh
}

export function executeLinuxLabCommand(input: string, legacy: LabState): CommandResult {
  const previous = legacy.linuxV2 ?? migrateLegacyLinuxState(legacy)
  const result = executeLinuxCommand(input, previous)
  const fs = result.state.filesystem
  const hasWorkspace = fs.nodes['/home/student/projects']?.type === 'directory'
  const hasReadme = fs.nodes['/home/student/projects/README.md']?.type === 'file'
  const currentDirectories = legacy.directories.filter(item => item !== '/home/student/projects')
  if (hasWorkspace) currentDirectories.push('/home/student/projects')

  // One-time observations are recorded only after successful commands.
  const observedWhoami = result.exitCode === 0 &&
    /(^|&&)\s*whoami(?:\s*(?:&&|$))/.test(input) &&
    result.output.some(line => line.trim() === 'student')
  const observedListing = result.exitCode === 0 &&
    /(^|&&)\s*ls(?:\s|$)/.test(input) &&
    hasReadme &&
    result.output.some(line => line.includes('README.md'))

  return {
    state: {
      ...legacy,
      cwd: result.state.cwd,
      directories: currentDirectories,
      readmeCreated: hasReadme,
      commandCount: result.state.commandCount,
      lastCommand: input,
      linuxV2: result.state,
      linuxSawWhoami: Boolean(legacy.linuxSawWhoami || observedWhoami || legacy.directories.includes('__identity__')),
      linuxListedReadme: Boolean(legacy.linuxListedReadme || observedListing),
    },
    output: result.output,
    tone: result.exitCode === 0 ? 'normal' : 'error',
    clear: result.clear,
  }
}

const EXAMPLES = [
  'help','whoami','pwd','ls','ls -la','cd ..','cd projects','mkdir -p projects',
  'mkdir -p ff','touch README.md','cat README.md','echo "Hello SYS/LAB" > README.md',
  'cp README.md copy.md','mv copy.md new.md','rm new.md','find .','tree',
  'grep SYS README.md','wc README.md','head README.md','tail README.md','stat README.md',
  'clear',
]

/** Reuses the existing LAB input component's Tab / completion UX. */
export function linuxCommandSuggestions(input: string): string[] {
  const query = input.trim().toLowerCase()
  if (!query) return []
  return EXAMPLES.filter(item => item.toLowerCase().startsWith(query) && item.toLowerCase() !== query).slice(0, 5)
}
