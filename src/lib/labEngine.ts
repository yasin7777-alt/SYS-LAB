export type TaskCondition =
  | 'identity'
  | 'workspace'
  | 'readme'
  | 'listing'
  | 'network-inspected'
  | 'gateway'
  | 'external-ping'
  | 'service-inspected'
  | 'service-running'
  | 'http-ok'
  | 'ports-inspected'

export interface LabTask {
  id: string
  title: string
  description: string
  hint: string
  command: string
  condition: TaskCondition
}

export interface LabScenario {
  id: string
  number: string
  title: string
  shortTitle: string
  category: string
  difficulty: string
  duration: string
  brief: string
  host: string
  tasks: LabTask[]
}

import type { LinuxTerminalState } from './linux/shell.ts'

export interface LabState {
  /** Optional V2 simulator snapshot; old localStorage saves remain readable. */
  linuxV2?: LinuxTerminalState
  linuxSawWhoami?: boolean
  linuxListedReadme?: boolean
  cwd: string
  directories: string[]
  readmeCreated: boolean
  gatewayConfigured: boolean
  nginxRunning: boolean
  inspectedNetwork: boolean
  inspectedNginx: boolean
  inspectedLogs: boolean
  externalPing: boolean
  httpChecked: boolean
  portsInspected: boolean
  commandCount: number
  lastCommand: string
}

export interface CommandResult {
  state: LabState
  output: string[]
  tone?: 'normal' | 'success' | 'error' | 'muted'
  clear?: boolean
}

export const scenarios: LabScenario[] = [
  {
    id: 'linux',
    number: '01',
    title: 'Первый контур Linux',
    shortTitle: 'Linux basics',
    category: 'LINUX / CLI',
    difficulty: 'СТАРТ',
    duration: '8–12 МИН',
    brief: 'Освойтесь в shell и соберите рабочую директорию проекта без графического интерфейса.',
    host: 'student@lab-linux-01',
    tasks: [
      {
        id: 'linux-identity',
        title: 'Определить пользователя',
        description: 'Узнайте, от чьего имени открыта текущая сессия.',
        hint: 'Команда whoami выводит имя активного пользователя.',
        command: 'whoami',
        condition: 'identity',
      },
      {
        id: 'linux-workspace',
        title: 'Создать workspace',
        description: 'Создайте директорию /home/student/projects, включая родительский путь.',
        hint: 'Флаг -p у mkdir создаёт отсутствующие родительские директории.',
        command: 'mkdir -p /home/student/projects',
        condition: 'workspace',
      },
      {
        id: 'linux-readme',
        title: 'Добавить README',
        description: 'Перейдите в projects и создайте пустой файл README.md.',
        hint: 'Можно выполнить две команды через &&: сначала cd, затем touch.',
        command: 'cd projects && touch README.md',
        condition: 'readme',
      },
      {
        id: 'linux-listing',
        title: 'Проверить результат',
        description: 'Выведите содержимое текущей директории в расширенном формате.',
        hint: 'ls -la покажет права, владельца, размер и скрытые файлы.',
        command: 'ls -la',
        condition: 'listing',
      },
    ],
  },
  {
    id: 'network',
    number: '02',
    title: 'Разорванный маршрут',
    shortTitle: 'Network repair',
    category: 'NETWORK / TCP/IP',
    difficulty: 'ИНЦИДЕНТ',
    duration: '10–15 МИН',
    brief: 'Хост видит локальную сеть, но не выходит в интернет. Найдите разрыв и восстановите default route.',
    host: 'admin@edge-gw-02',
    tasks: [
      {
        id: 'network-interface',
        title: 'Снять состояние интерфейсов',
        description: 'Проверьте адрес и состояние сетевых интерфейсов.',
        hint: 'ip addr — современная замена устаревшей ifconfig.',
        command: 'ip addr',
        condition: 'network-inspected',
      },
      {
        id: 'network-gateway',
        title: 'Восстановить шлюз',
        description: 'Добавьте маршрут по умолчанию через 10.10.20.1.',
        hint: 'Используйте ip route add default via и адрес шлюза из задания.',
        command: 'ip route add default via 10.10.20.1',
        condition: 'gateway',
      },
      {
        id: 'network-ping',
        title: 'Проверить внешнюю связность',
        description: 'Отправьте три ICMP-пакета публичному резолверу 1.1.1.1.',
        hint: 'Флаг -c 3 ограничивает ping тремя пакетами.',
        command: 'ping -c 3 1.1.1.1',
        condition: 'external-ping',
      },
    ],
  },
  {
    id: 'service',
    number: '03',
    title: 'Веб-сервер не отвечает',
    shortTitle: 'Service recovery',
    category: 'LINUX / INCIDENT',
    difficulty: 'ИНЦИДЕНТ',
    duration: '12–18 МИН',
    brief: 'nginx остановлен после OOM-события. Диагностируйте сервис, поднимите его и докажите восстановление.',
    host: 'ops@web-prod-03',
    tasks: [
      {
        id: 'service-status',
        title: 'Проверить unit',
        description: 'Получите состояние nginx через systemd.',
        hint: 'systemctl status nginx покажет Active State и последние события.',
        command: 'systemctl status nginx',
        condition: 'service-inspected',
      },
      {
        id: 'service-restart',
        title: 'Запустить сервис',
        description: 'Выполните контролируемый перезапуск nginx.',
        hint: 'Для systemctl restart в этой лаборатории sudo можно опустить.',
        command: 'systemctl restart nginx',
        condition: 'service-running',
      },
      {
        id: 'service-http',
        title: 'Проверить HTTP-ответ',
        description: 'Запросите заголовки локального веб-сервера.',
        hint: 'curl -I выполняет HEAD-запрос и возвращает только заголовки.',
        command: 'curl -I http://localhost',
        condition: 'http-ok',
      },
      {
        id: 'service-ports',
        title: 'Подтвердить listening socket',
        description: 'Убедитесь, что nginx слушает TCP-порт 80.',
        hint: 'ss -tulpn показывает сокеты, процессы и числовые порты.',
        command: 'ss -tulpn',
        condition: 'ports-inspected',
      },
    ],
  },
]

export function createInitialState(): LabState {
  return {
    cwd: '/home/student',
    directories: [],
    readmeCreated: false,
    gatewayConfigured: false,
    nginxRunning: false,
    inspectedNetwork: false,
    inspectedNginx: false,
    inspectedLogs: false,
    externalPing: false,
    httpChecked: false,
    portsInspected: false,
    commandCount: 0,
    lastCommand: '',
  }
}

export function isTaskComplete(condition: TaskCondition, state: LabState): boolean {
  switch (condition) {
    case 'identity':
      return state.linuxV2 ? Boolean(state.linuxSawWhoami) : /(^|\s)whoami(\s|$)/.test(state.lastCommand) || state.directories.includes('__identity__')
    case 'workspace':
      return state.directories.includes('/home/student/projects')
    case 'readme':
      return state.readmeCreated
    case 'listing':
      return state.linuxV2 ? Boolean(state.linuxListedReadme) : state.readmeCreated && /^ls(\s|$)/.test(state.lastCommand)
    case 'network-inspected':
      return state.inspectedNetwork
    case 'gateway':
      return state.gatewayConfigured
    case 'external-ping':
      return state.externalPing
    case 'service-inspected':
      return state.inspectedNginx
    case 'service-running':
      return state.nginxRunning
    case 'http-ok':
      return state.httpChecked
    case 'ports-inspected':
      return state.portsInspected
  }
}

const promptPath = (cwd: string) => (cwd === '/home/student' ? '~' : cwd.replace('/home/student/', '~/'))

function pingOutput(target: string, success: boolean): string[] {
  if (!success) {
    return [
      `PING ${target} (${target}) 56(84) bytes of data.`,
      `From 10.10.20.14 icmp_seq=1 Destination Host Unreachable`,
      `From 10.10.20.14 icmp_seq=2 Destination Host Unreachable`,
      '',
      `--- ${target} ping statistics ---`,
      '3 packets transmitted, 0 received, +2 errors, 100% packet loss',
    ]
  }
  const resolved = target === '1.1.1.1' ? 'one.one.one.one' : target
  return [
    `PING ${target} (${target}) 56(84) bytes of data.`,
    `64 bytes from ${resolved}: icmp_seq=1 ttl=57 time=11.8 ms`,
    `64 bytes from ${resolved}: icmp_seq=2 ttl=57 time=10.9 ms`,
    `64 bytes from ${resolved}: icmp_seq=3 ttl=57 time=11.3 ms`,
    '',
    `--- ${target} ping statistics ---`,
    '3 packets transmitted, 3 received, 0% packet loss, time 2003ms',
    'rtt min/avg/max/mdev = 10.9/11.3/11.8/0.4 ms',
  ]
}

function executeSingle(rawCommand: string, current: LabState): CommandResult {
  const state: LabState = { ...current, directories: [...current.directories] }
  let command = rawCommand.trim().replace(/\s+/g, ' ')
  if (command.startsWith('sudo ')) command = command.slice(5)
  state.lastCommand = command
  state.commandCount += 1

  const done = (output: string[], tone: CommandResult['tone'] = 'normal'): CommandResult => ({ state, output, tone })
  const fail = (output: string[]): CommandResult => ({ state, output, tone: 'error' })

  if (!command) return { state: current, output: [] }
  if (command === 'clear') return { state, output: [], clear: true }
  if (command === 'help') {
    return done([
      'Доступные команды в этом стенде:',
      '  whoami · pwd · hostname · ls · cd · mkdir · touch · cat',
      '  ip addr · ip route · ping · systemctl · journalctl',
      '  curl -I · ss -tulpn · history · clear',
      '',
      '↑/↓ — история · Tab — автодополнение · команды можно соединять через &&',
    ], 'muted')
  }
  if (command === 'whoami') {
    state.directories = Array.from(new Set([...state.directories, '__identity__']))
    return done(['student'])
  }
  if (command === 'pwd') return done([state.cwd])
  if (command === 'hostname' || command === 'hostnamectl') return done(['lab-node-01', 'Virtualization: syslab-sim', 'Operating System: Ubuntu 24.04 LTS', 'Kernel: Linux 6.8.0-45-generic'])
  if (command === 'uptime') return done([' 14:32:08 up 17 days,  3:41,  1 user,  load average: 0.18, 0.24, 0.21'])
  if (command === 'history') return done(['История доступна клавишами ↑ и ↓ в поле ввода.'], 'muted')

  if (command === 'mkdir -p /home/student/projects' || command === 'mkdir -p ~/projects' || (command === 'mkdir -p projects' && state.cwd === '/home/student')) {
    if (!state.directories.includes('/home/student/projects')) state.directories.push('/home/student/projects')
    return done([], 'success')
  }
  if (command.startsWith('mkdir')) {
    const target = command.split(' ').pop()
    return fail([`mkdir: cannot create directory ‘${target}’: use the absolute path and -p for this lab`])
  }
  if (command === 'cd projects' || command === 'cd /home/student/projects' || command === 'cd ~/projects') {
    if (!state.directories.includes('/home/student/projects')) return fail([`bash: cd: projects: No such file or directory`])
    state.cwd = '/home/student/projects'
    return done([])
  }
  if (command === 'cd' || command === 'cd ~' || command === 'cd /home/student') {
    state.cwd = '/home/student'
    return done([])
  }
  if (command === 'cd ..') {
    state.cwd = '/home/student'
    return done([])
  }
  if (command.startsWith('cd ')) return fail([`bash: cd: ${command.slice(3)}: No such file or directory`])
  if (command === 'touch README.md' || command === 'touch ./README.md') {
    if (state.cwd !== '/home/student/projects') return fail(['touch: cannot touch ‘README.md’: open projects directory first'])
    state.readmeCreated = true
    return done([], 'success')
  }
  if (command === 'cat README.md') {
    if (!state.readmeCreated || state.cwd !== '/home/student/projects') return fail(['cat: README.md: No such file or directory'])
    return done(['# SYS/LAB project', '', 'Built, not just studied.'])
  }
  if (/^ls(\s|$)/.test(command)) {
    if (state.cwd === '/home/student/projects') {
      return done([
        'total 8',
        'drwxr-xr-x 2 student student 4096 Nov 02 14:32 .',
        'drwxr-xr-x 3 student student 4096 Nov 02 14:30 ..',
        state.readmeCreated ? '-rw-r--r-- 1 student student   38 Nov 02 14:32 README.md' : '',
      ].filter(Boolean))
    }
    return done([
      'total 12',
      'drwxr-xr-x 3 student student 4096 Nov 02 14:30 .',
      'drwxr-xr-x 3 root    root    4096 Nov 02 14:28 ..',
      '-rw-r--r-- 1 student student  220 Nov 02 14:28 .bash_logout',
      '-rw-r--r-- 1 student student 3771 Nov 02 14:28 .bashrc',
      state.directories.includes('/home/student/projects') ? 'drwxr-xr-x 2 student student 4096 Nov 02 14:31 projects' : '',
    ].filter(Boolean))
  }

  if (command === 'ip addr' || command === 'ip a' || command === 'ip address') {
    state.inspectedNetwork = true
    return done([
      '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN',
      '    inet 127.0.0.1/8 scope host lo',
      '2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP',
      '    link/ether 52:54:00:8a:21:0f brd ff:ff:ff:ff:ff:ff',
      '    inet 10.10.20.14/24 brd 10.10.20.255 scope global eth0',
      '    inet6 fe80::5054:ff:fe8a:210f/64 scope link',
    ])
  }
  if (command === 'ip route' || command === 'ip r' || command === 'ip route show') {
    return done([
      state.gatewayConfigured ? 'default via 10.10.20.1 dev eth0 proto static metric 100' : '',
      '10.10.20.0/24 dev eth0 proto kernel scope link src 10.10.20.14',
    ].filter(Boolean))
  }
  if (command === 'ip route add default via 10.10.20.1' || command === 'ip r add default via 10.10.20.1') {
    if (state.gatewayConfigured) return fail(['RTNETLINK answers: File exists'])
    state.gatewayConfigured = true
    return done(['default via 10.10.20.1 dev eth0 — маршрут добавлен'], 'success')
  }
  if (command.startsWith('ip route add default')) return fail(['Error: nexthop address is invalid. Expected gateway: 10.10.20.1'])
  if (command === 'ip route del default') {
    state.gatewayConfigured = false
    state.externalPing = false
    return done(['Маршрут по умолчанию удалён'], 'muted')
  }
  if (/^ping(\s|$)/.test(command)) {
    const parts = command.split(' ')
    const target = parts[parts.length - 1]
    if (!target || target === 'ping' || target.startsWith('-')) return fail(['ping: usage error: Destination address required'])
    const local = target === 'localhost' || target === '127.0.0.1' || target === '10.10.20.1'
    const success = local || state.gatewayConfigured
    if (success && !local) state.externalPing = true
    return { state, output: pingOutput(target, success), tone: success ? 'success' : 'error' }
  }

  if (command === 'systemctl status nginx' || command === 'service nginx status') {
    state.inspectedNginx = true
    return done([
      '● nginx.service - A high performance web server and a reverse proxy server',
      '     Loaded: loaded (/lib/systemd/system/nginx.service; enabled)',
      state.nginxRunning ? '     Active: active (running) since Mon 2026-11-02 14:34:11 UTC; 8s ago' : '     Active: failed (Result: oom-kill) since Mon 2026-11-02 14:21:44 UTC; 12min ago',
      `   Main PID: ${state.nginxRunning ? '842 (nginx)' : '619 (code=killed, signal=KILL)'}`,
      state.nginxRunning ? '      Tasks: 3 (limit: 4621)  Memory: 8.4M' : '        CPU: 24ms',
      '',
      state.nginxRunning ? 'Nov 02 14:34:11 web-prod-03 systemd[1]: Started nginx.service.' : 'Nov 02 14:21:44 web-prod-03 systemd[1]: nginx.service: Failed with result ‘oom-kill’.',
    ], state.nginxRunning ? 'success' : 'error')
  }
  if (command === 'systemctl restart nginx' || command === 'systemctl start nginx' || command === 'service nginx restart') {
    state.nginxRunning = true
    return done(['nginx.service: active (running)', 'Worker processes: 2 · master PID: 842'], 'success')
  }
  if (command === 'systemctl stop nginx') {
    state.nginxRunning = false
    state.httpChecked = false
    state.portsInspected = false
    return done(['nginx.service: stopped'], 'muted')
  }
  if (command === 'journalctl -u nginx -n 5' || command === 'journalctl -u nginx') {
    state.inspectedLogs = true
    return done([
      'Nov 02 14:21:40 web-prod-03 kernel: Out of memory: Killed process 619 (nginx)',
      'Nov 02 14:21:44 web-prod-03 systemd[1]: nginx.service: Main process exited, code=killed, status=9/KILL',
      'Nov 02 14:21:44 web-prod-03 systemd[1]: nginx.service: Failed with result ‘oom-kill’.',
      'Hint: memory pressure has been relieved; the unit can be restarted.',
    ], 'muted')
  }
  if (command === 'curl -I localhost' || command === 'curl -I http://localhost' || command === 'curl --head http://localhost') {
    if (!state.nginxRunning) return fail(['curl: (7) Failed to connect to localhost port 80 after 0 ms: Couldn’t connect to server'])
    state.httpChecked = true
    return done([
      'HTTP/1.1 200 OK',
      'Server: nginx/1.24.0 (Ubuntu)',
      'Date: Mon, 02 Nov 2026 14:34:22 GMT',
      'Content-Type: text/html',
      'Content-Length: 612',
      'Connection: keep-alive',
    ], 'success')
  }
  if (command === 'ss -tulpn' || command === 'ss -tlnp') {
    state.portsInspected = state.nginxRunning
    return done([
      'Netid State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process',
      'tcp   LISTEN 0      128        127.0.0.1:22        0.0.0.0:*    users:(("sshd",pid=511,fd=3))',
      state.nginxRunning ? 'tcp   LISTEN 0      511          0.0.0.0:80        0.0.0.0:*    users:(("nginx",pid=842,fd=6))' : '',
      state.nginxRunning ? 'tcp   LISTEN 0      511             [::]:80           [::]:*    users:(("nginx",pid=842,fd=7))' : '',
    ].filter(Boolean), state.nginxRunning ? 'success' : 'normal')
  }
  if (command === 'nginx -t') {
    return done([
      'nginx: the configuration file /etc/nginx/nginx.conf syntax is ok',
      'nginx: configuration file /etc/nginx/nginx.conf test is successful',
    ], 'success')
  }

  return fail([
    `bash: ${command.split(' ')[0]}: command not found or not available in this scenario`,
    'Введите help, чтобы увидеть поддерживаемые команды.',
  ])
}

export function executeCommand(input: string, initial: LabState): CommandResult {
  const segments = input.split('&&').map((part) => part.trim()).filter(Boolean)
  if (segments.length <= 1) return executeSingle(input, initial)

  let state = { ...initial, directories: [...initial.directories] }
  const output: string[] = []
  let tone: CommandResult['tone'] = 'normal'

  for (const segment of segments) {
    const result = executeSingle(segment, state)
    state = result.state
    if (result.output.length) {
      output.push(`${promptPath(initial.cwd)} $ ${segment}`, ...result.output)
    }
    if (result.tone === 'error') {
      tone = 'error'
      output.push(`Цепочка остановлена: ${segment}`)
      break
    }
    if (result.tone === 'success') tone = 'success'
  }
  state.lastCommand = segments[segments.length - 1].replace(/^sudo\s+/, '')
  return { state, output, tone }
}

export function commandSuggestions(input: string): string[] {
  const commands = [
    'whoami', 'pwd', 'help', 'ls -la', 'mkdir -p /home/student/projects',
    'cd projects && touch README.md', 'ip addr', 'ip route',
    'ip route add default via 10.10.20.1', 'ping -c 3 1.1.1.1',
    'systemctl status nginx', 'systemctl restart nginx', 'journalctl -u nginx -n 5',
    'curl -I http://localhost', 'ss -tulpn', 'clear',
  ]
  if (!input.trim()) return []
  return commands.filter((command) => command.startsWith(input.trim().toLowerCase()) && command !== input.trim()).slice(0, 4)
}
