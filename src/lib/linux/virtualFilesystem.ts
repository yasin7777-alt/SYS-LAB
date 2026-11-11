/**
 * SYS/LAB Terminal 2.0 — pure, browser-side virtual filesystem.
 * All operations touch this in-memory model only, never the visitor's device.
 * Snapshots are JSON serializable; persistence is an independent later step.
 */

export type VirtualNode =
  | { type: 'directory'; owner: string; mode: number; modifiedAt: number }
  | { type: 'file'; owner: string; mode: number; modifiedAt: number; content: string }

export interface VirtualFilesystem {
  nodes: Record<string, VirtualNode>
}

const MAX_NODES = 2000
const MAX_FILE_CHARS = 65_536

export function resolvePath(cwd: string, requested: string): string {
  const input = requested === '~' ? '/home/student'
    : requested.startsWith('~/') ? '/home/student/' + requested.slice(2)
    : requested.startsWith('/') ? requested : cwd + '/' + requested
  const segments: string[] = []
  for (const segment of input.split('/')) {
    if (!segment || segment === '.') continue
    if (segment === '..') segments.pop()
    else segments.push(segment)
  }
  if (segments.length > 40) throw new Error('Path too deep')
  return '/' + segments.join('/')
}

export function basename(path: string): string {
  return path === '/' ? '/' : path.slice(path.lastIndexOf('/') + 1)
}

export function parentPath(path: string): string {
  if (path === '/') return '/'
  return path.substring(0, path.lastIndexOf('/')) || '/'
}

export function createVirtualFilesystem(): VirtualFilesystem {
  const nodes: Record<string, VirtualNode> = {}
  const mkDir = (path: string, owner = 'root') => {
    nodes[path] = { type: 'directory', owner, mode: owner === 'root' ? 0o755 : 0o755, modifiedAt: 0 }
  }
  const mkFile = (path: string, content: string, owner = 'root') => {
    nodes[path] = { type: 'file', content, owner, mode: 0o644, modifiedAt: 0 }
  }
  for (const dir of ['/', '/home', '/etc', '/tmp', '/var', '/var/log', '/usr', '/usr/bin']) mkDir(dir)
  for (const dir of ['/home/student', '/home/student/Documents', '/home/student/Downloads']) mkDir(dir, 'student')
  mkFile('/etc/hostname', 'syslab-linux\n')
  mkFile('/etc/hosts', '127.0.0.1 localhost\n127.0.1.1 syslab-linux\n')
  mkFile('/home/student/welcome.txt', 'Welcome to SYS/LAB Linux Terminal 2.0!\n', 'student')
  return { nodes }
}

export function cloneVirtualFilesystem(fs: VirtualFilesystem): VirtualFilesystem {
  return { nodes: Object.fromEntries(
    Object.entries(fs.nodes).map(([path, node]) => [path, { ...node }])
  ) }
}

export function getVirtualNode(fs: VirtualFilesystem, path: string): VirtualNode {
  const node = fs.nodes[path]
  if (!node) throw new Error(path + ': No such file or directory')
  return node
}

export function listChildren(fs: VirtualFilesystem, directory: string): Array<{ name: string; path: string; node: VirtualNode }> {
  const node = getVirtualNode(fs, directory)
  if (node.type !== 'directory') throw new Error(directory + ': Not a directory')
  return Object.entries(fs.nodes)
    .filter(([path]) => path !== directory && parentPath(path) === directory)
    .map(([path, child]) => ({ name: basename(path), path, node: child }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function assertWritablePath(path: string): void {
  // V1 permissions: the user owns their home directory and /tmp.
  if (path !== '/home/student' && !path.startsWith('/home/student/') &&
      path !== '/tmp' && !path.startsWith('/tmp/')) {
    throw new Error(path + ': Permission denied')
  }
}

function assertWritableParent(fs: VirtualFilesystem, path: string): void {
  assertWritablePath(path)
  const parent = parentPath(path)
  if (getVirtualNode(fs, parent).type !== 'directory') throw new Error(parent + ': Not a directory')
}

function assertCapacity(fs: VirtualFilesystem): void {
  if (Object.keys(fs.nodes).length >= MAX_NODES) throw new Error('Virtual filesystem is full')
}

export function createDirectory(fs: VirtualFilesystem, path: string, recursive = false): void {
  const existing = fs.nodes[path]
  if (existing) {
    if (recursive && existing.type === 'directory') return
    throw new Error(path + ': File exists')
  }
  if (recursive) {
    const parent = parentPath(path)
    if (!fs.nodes[parent]) createDirectory(fs, parent, true)
  }
  assertWritableParent(fs, path)
  assertCapacity(fs)
  fs.nodes[path] = { type: 'directory', owner: 'student', mode: 0o755, modifiedAt: Date.now() }
}

export function writeVirtualFile(
  fs: VirtualFilesystem, path: string, content: string, mode: 'overwrite' | 'append' | 'touch' = 'overwrite',
): void {
  assertWritableParent(fs, path)
  const previous = fs.nodes[path]
  if (previous?.type === 'directory') throw new Error(path + ': Is a directory')
  const next = mode === 'touch' ? previous?.content ?? ''
    : mode === 'append' ? (previous?.content ?? '') + content : content
  if (next.length > MAX_FILE_CHARS) throw new Error(path + ': File exceeds virtual size limit')
  if (!previous) assertCapacity(fs)
  fs.nodes[path] = { type: 'file', owner: 'student', mode: previous?.mode ?? 0o644, modifiedAt: Date.now(), content: next }
}

export function readVirtualFile(fs: VirtualFilesystem, path: string): string {
  const node = getVirtualNode(fs, path)
  if (node.type !== 'file') throw new Error(path + ': Is a directory')
  return node.content
}

export function removeVirtualNode(fs: VirtualFilesystem, path: string, recursive = false): void {
  if (['/', '/home', '/home/student', '/tmp'].includes(path)) throw new Error(path + ': Protected directory')
  assertWritableParent(fs, path)
  const node = getVirtualNode(fs, path)
  const children = node.type === 'directory' ? listChildren(fs, path) : []
  if (children.length && !recursive) throw new Error(path + ': Directory not empty')
  for (const item of Object.keys(fs.nodes)) {
    if (item === path || item.startsWith(path + '/')) delete fs.nodes[item]
  }
}

export function copyVirtualNode(fs: VirtualFilesystem, source: string, destination: string, recursive = false): string {
  const node = getVirtualNode(fs, source)
  const resolved = fs.nodes[destination]?.type === 'directory'
    ? resolvePath(destination, basename(source)) : destination
  if (node.type === 'directory' && !recursive) throw new Error(source + ': Is a directory (use -r)')
  if (source === resolved || resolved.startsWith(source + '/')) {
    throw new Error('Cannot copy a directory or file into itself')
  }
  assertWritableParent(fs, resolved)
  const entries = Object.entries(fs.nodes).filter(([path]) => path === source || path.startsWith(source + '/'))
  if (Object.keys(fs.nodes).length + entries.length > MAX_NODES) throw new Error('Virtual filesystem is full')
  if (fs.nodes[resolved]?.type === 'directory' && listChildren(fs, resolved).length) {
    throw new Error(resolved + ': Directory not empty')
  }
  if (fs.nodes[resolved] && fs.nodes[resolved].type !== node.type) throw new Error(resolved + ': Incompatible destination')
  for (const [path, entry] of entries) {
    const target = resolved + path.slice(source.length)
    fs.nodes[target] = { ...entry, owner: 'student', modifiedAt: Date.now() }
  }
  return resolved
}

export function moveVirtualNode(fs: VirtualFilesystem, source: string, destination: string): string {
  assertWritableParent(fs, source)
  const resolved = copyVirtualNode(fs, source, destination, true)
  removeVirtualNode(fs, source, true)
  return resolved
}
