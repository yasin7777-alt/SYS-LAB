/**
 * SYS/LAB Linux Terminal 2.0: first batch of virtual commands.
 * This is an isolated, deterministic simulation; no real OS access.
 */
import {
  basename, cloneVirtualFilesystem, copyVirtualNode, createDirectory,
  createVirtualFilesystem, getVirtualNode, listChildren, moveVirtualNode,
  readVirtualFile, removeVirtualNode, resolvePath, writeVirtualFile,
  type VirtualFilesystem,
} from './virtualFilesystem.ts'

export interface LinuxTerminalState {
  cwd: string
  previousCwd: string
  user: string
  host: string
  filesystem: VirtualFilesystem
  commandCount: number
  lastExitCode: number
}
export interface LinuxCommandResult {
  state: LinuxTerminalState
  output: string[]
  exitCode: number
  clear?: boolean
}
export const INITIAL_COMMANDS = [
  'pwd','whoami','hostname','help','clear','cd','ls','mkdir','touch','cat',
  'echo','cp','mv','rm','rmdir','head','tail','wc','find','tree','stat','grep',
] as const

export function createLinuxTerminalState(): LinuxTerminalState {
  return { cwd:'/home/student', previousCwd:'/home/student', user:'student',
    host:'syslab-linux', filesystem:createVirtualFilesystem(), commandCount:0, lastExitCode:0 }
}

/** Tokenize quotes, escaped characters, && and > / >> operators. */
export function tokenizeShell(line: string): string[] {
  if (line.length > 4096) throw new Error('Command exceeds 4096 characters')
  const result: string[] = []
  let word = '', started = false, quote: string | null = null
  const flush = () => { if (started) result.push(word); word = ''; started = false }
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quote) {
      if (ch === quote) { quote = null; continue }
      if (ch === '\\' && quote === '"' && i + 1 < line.length) word += line[++i]
      else word += ch
      started = true
    } else if (ch === "'" || ch === '"') { quote = ch; started = true }
    else if (ch === '\\' && i + 1 < line.length) { word += line[++i]; started = true }
    else if (/\s/.test(ch)) flush()
    else if (ch === '|' || ch === ';' || ch === '<') throw new Error('Pipes and this operator are not supported yet')
    else if (ch === '&') {
      if (line[i + 1] !== '&') throw new Error('Only && is supported')
      flush(); result.push('&&'); i++
    } else if (ch === '>') {
      flush()
      if (line[i + 1] === '>') { result.push('>>'); i++ }
      else result.push('>')
    } else { word += ch; started = true }
  }
  if (quote) throw new Error('Unclosed quotation mark')
  flush()
  return result
}
function flagArgs(args: string[], valid: string): { flags: Set<string>; values: string[] } {
  const flags = new Set<string>(), values: string[] = []
  let options = true
  for (const arg of args) {
    if (arg === '--' && options) { options = false; continue }
    if (options && /^-[a-zA-Z]+$/.test(arg)) {
      for (const flag of arg.slice(1)) {
        if (!valid.includes(flag)) throw new Error('Invalid flag -' + flag)
        flags.add(flag)
      }
    } else values.push(arg)
  }
  return { flags, values }
}
function permissions(mode: number, dir: boolean): string {
  return (dir ? 'd' : '-') + [...'rwxrwxrwx'].map((c,i) => mode & (1 << (8-i)) ? c : '-').join('')
}
function executeOne(state: LinuxTerminalState, tokens: string[]): { output: string[]; clear?: boolean } {
  const [cmd,...args] = tokens
  const fs = state.filesystem
  const full = (p: string) => resolvePath(state.cwd,p)
  const only = (name: string, parts: string[], fallback?: string): string => {
    if (parts.length > 1 || (!parts.length && fallback === undefined)) throw new Error(name + ': Expected one path')
    return full(parts[0] ?? fallback!)
  }
  switch (cmd) {
    case 'help': return { output: [
      'SYS/LAB Terminal 2.0 — first 22 virtual commands:',
      INITIAL_COMMANDS.join(' · '),
      'Supported: quotes, &&, >, >> and selected flags. Pipes: planned for later.',
    ] }
    case 'pwd': return { output: [state.cwd] }
    case 'whoami': return { output: [state.user] }
    case 'hostname': return { output: [state.host] }
    case 'clear': return { output: [], clear: true }
    case 'cd': {
      const dest = args[0] === '-' && args.length === 1 ? state.previousCwd : only('cd',args,'~')
      if (getVirtualNode(fs,dest).type !== 'directory') throw new Error(dest + ': Not a directory')
      state.previousCwd = state.cwd; state.cwd = dest
      return { output: args[0] === '-' ? [dest] : [] }
    }
    case 'ls': {
      const {flags,values} = flagArgs(args,'al')
      const dest = only('ls',values,'.')
      const node = getVirtualNode(fs,dest)
      const entries = node.type === 'directory' ? listChildren(fs,dest) : [{name:basename(dest),path:dest,node}]
      const visible = flags.has('a') ? entries : entries.filter(e=>!e.name.startsWith('.'))
      return { output: flags.has('l')
        ? visible.map(e=> permissions(e.node.mode,e.node.type==='directory')+' 1 '+e.node.owner+' '+(e.node.type==='file'?e.node.content.length:4096)+' '+e.name)
        : [visible.map(e=>e.name).join('  ')].filter(Boolean) }
    }
    case 'mkdir': {
      const {flags,values} = flagArgs(args,'p')
      if (!values.length) throw new Error('mkdir: Missing directory operand')
      for (const p of values) createDirectory(fs,full(p),flags.has('p'))
      return { output: [] }
    }
    case 'touch': {
      if (!args.length) throw new Error('touch: Missing file operand')
      for (const p of args) writeVirtualFile(fs,full(p),'','touch')
      return { output: [] }
    }
    case 'cat': {
      if (!args.length) throw new Error('cat: Missing file operand')
      return { output: [args.map(p=>readVirtualFile(fs,full(p))).join('')] }
    }
    case 'echo': return { output: [args.join(' ')+'\n'] }
    case 'cp': {
      const {flags,values} = flagArgs(args,'rR')
      if (values.length!==2) throw new Error('cp: Expected SOURCE DEST')
      copyVirtualNode(fs,full(values[0]),full(values[1]),flags.has('r')||flags.has('R'))
      return { output: [] }
    }
    case 'mv': {
      if (args.length!==2) throw new Error('mv: Expected SOURCE DEST')
      moveVirtualNode(fs,full(args[0]),full(args[1])); return { output: [] }
    }
    case 'rm': {
      const {flags,values} = flagArgs(args,'rf')
      if (!values.length) throw new Error('rm: Missing operand')
      for (const p of values) {
        const dest=full(p)
        if (flags.has('f') && !fs.nodes[dest]) continue
        const node=getVirtualNode(fs,dest)
        if (node.type==='directory' && !flags.has('r')) throw new Error(dest+': Is a directory')
        removeVirtualNode(fs,dest,flags.has('r'))
      }
      return { output: [] }
    }
    case 'rmdir': {
      if (!args.length) throw new Error('rmdir: Missing operand')
      for (const p of args) {
        const dest=full(p)
        if (getVirtualNode(fs,dest).type!=='directory') throw new Error(dest+': Not a directory')
        removeVirtualNode(fs,dest)
      }
      return { output: [] }
    }
    case 'head':
    case 'tail': {
      let count=10, params=[...args]
      if (params[0]==='-n') {
        count=Number(params[1]);params=params.slice(2)
        if (!Number.isInteger(count)||count<0||count>500) throw new Error(cmd+': Invalid line count')
      }
      const lines=readVirtualFile(fs,only(cmd,params)).split('\n')
      if (lines[lines.length-1]==='') lines.pop()
      return { output:[(cmd==='head'?lines.slice(0,count):count===0?[]:lines.slice(-count)).join('\n')] }
    }
    case 'wc': {
      const {flags,values}=flagArgs(args,'lwc')
      const dest=only('wc',values),content=readVirtualFile(fs,dest)
      const lines=(content.match(/\n/g)||[]).length
      const words=content.trim()?content.trim().split(/\s+/).length:0
      const bytes=new TextEncoder().encode(content).length
      const parts=flags.size===0?[lines,words,bytes]:
        [flags.has('l')?lines:null,flags.has('w')?words:null,flags.has('c')?bytes:null].filter(x=>x!==null)
      return { output:[parts.join(' ')+' '+dest] }
    }
    case 'find': {
      const target=full(!args[0]||args[0].startsWith('-')?'.':args[0])
      const rest=!args[0]||args[0].startsWith('-')?args:args.slice(1)
      const pattern=rest.length===2&&rest[0]==='-name'?rest[1]:undefined
      if (rest.length&&pattern===undefined) throw new Error('find: Only -name PATTERN supported')
      getVirtualNode(fs,target)
      const matches=Object.keys(fs.nodes).filter(p=>p===target||p.startsWith(target+'/'))
      const matcher=(s:string)=>!pattern||new RegExp('^'+pattern.split('*').map(chunk=>[...chunk].map(c=>'.+?^$()[]{}|\\'.includes(c)?'\\'+c:c).join('')).join('.*')+'$').test(s)
      return { output:matches.filter(p=>matcher(basename(p))).sort().slice(0,300) }
    }
    case 'tree': {
      const target=only('tree',args,'.')
      if(getVirtualNode(fs,target).type!=='directory') throw new Error('tree: Not a directory')
      const rows=[target]
      const walk=(dir:string,prefix:string):void=>{
        const entries=listChildren(fs,dir)
        for(let i=0;i<entries.length&&rows.length<300;i++){
          const entry=entries[i],last=i===entries.length-1
          rows.push(prefix+(last?'└── ':'├── ')+entry.name)
          if(entry.node.type==='directory')walk(entry.path,prefix+(last?'    ':'│   '))
        }
      }
      walk(target,'');return { output:rows }
    }
    case 'stat': {
      const dest=only('stat',args),node=getVirtualNode(fs,dest)
      return { output:['File: '+dest,'Type: '+node.type,'Mode: '+node.mode.toString(8),'Owner: '+node.owner,
        'Size: '+(node.type==='file'?new TextEncoder().encode(node.content).length:4096)] }
    }
    case 'grep': {
      const {flags,values}=flagArgs(args,'in')
      if(values.length<2)throw new Error('grep: Expected PATTERN FILE')
      const needle=flags.has('i')?values[0].toLowerCase():values[0],rows:string[]=[]
      for(const file of values.slice(1)){
        readVirtualFile(fs,full(file)).split('\n').forEach((line,i)=>{
          if((flags.has('i')?line.toLowerCase():line).includes(needle))
            rows.push((flags.has('n')?i+1+':':'')+line)
        })
      }
      return { output:rows }
    }
    default:throw new Error(cmd+': command not found (type help)')
  }
}

export function executeLinuxCommand(input: string, initial: LinuxTerminalState): LinuxCommandResult {
  const state: LinuxTerminalState={...initial,filesystem:cloneVirtualFilesystem(initial.filesystem)}
  let tokens:string[]
  try{tokens=tokenizeShell(input)}
  catch(e){return{state:{...state,lastExitCode:2},output:[(e as Error).message],exitCode:2}}
  if (!tokens.length) return {state,output:[],exitCode:0}
  const groups:string[][]=[[]]
  for(const t of tokens){if(t==='&&')groups.push([]);else groups[groups.length-1].push(t)}
  if(groups.some(g=>!g.length))
    return{state:{...state,lastExitCode:2},output:['bash: syntax error near &&'],exitCode:2}
  const out:string[]=[]
  let clear=false,exitCode=0
  for(const group of groups){
    state.commandCount++
    try{
      const at=group.findIndex(t=>t==='>'||t==='>>')
      const words=at===-1?group:group.slice(0,at)
      if(at!==-1&&(group.length!==at+2||!words.length))throw new Error('Invalid output redirection')
      if(at!==-1&&words[0]==='clear')throw new Error('Cannot redirect clear')
      const result=executeOne(state,words)
      clear=Boolean(result.clear)
      if(at===-1)out.push(...result.output)
      else writeVirtualFile(state.filesystem,resolvePath(state.cwd,group[at+1]),result.output.join('\n'),group[at]==='>>'?'append':'overwrite')
      exitCode=0
    }catch(e){out.push((e as Error).message);exitCode=1;break}
  }
  state.lastExitCode=exitCode
  return{state,output:out.slice(0,300).map(line=>line.slice(0,40_000)),exitCode,clear}
}
