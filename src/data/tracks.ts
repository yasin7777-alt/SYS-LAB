export interface TrackModule {
  code: string
  title: string
  description: string
  lessons: number
  lab: string
}

export interface Track {
  id: string
  number: string
  title: string
  englishTitle: string
  description: string
  outcome: string
  level: string
  duration: string
  format: string
  accent: string
  skills: string[]
  tools: string[]
  modules: TrackModule[]
  labId: 'linux' | 'network' | 'service'
}

export const tracks: Track[] = [
  {
    id: 'linux-engineering',
    number: '01',
    title: 'Linux Engineering',
    englishTitle: 'От shell до production',
    description: 'Не заучивайте команды списком. Поймите жизненный цикл процесса, файловую систему, systemd и права — через действия в терминале.',
    outcome: 'Разверните и обеспечьте работу Linux-узла: пользователи, SSH, службы, логи и автоматизация рутины.',
    level: 'С НУЛЯ',
    duration: '8 НЕДЕЛЬ',
    format: '24 УРОКА / 4 МОДУЛЯ',
    accent: '#d7ff3f',
    skills: ['Shell и навигация', 'systemd и journald', 'Права и пользователи', 'Bash-автоматизация'],
    tools: ['Ubuntu Server', 'systemd', 'Bash', 'SSH'],
    labId: 'linux',
    modules: [
      { code: 'LNX.01', title: 'Анатомия системы', description: 'Kernel, user space, FHS, процессы и работа в shell без магии.', lessons: 6, lab: 'Соберите рабочее окружение и исследуйте дерево процессов.' },
      { code: 'LNX.02', title: 'Доступ и безопасность', description: 'UID/GID, биты прав, sudo, SSH-ключи и принцип минимальных привилегий.', lessons: 6, lab: 'Настройте беспарольный SSH и исправьте инцидент с правами.' },
      { code: 'LNX.03', title: 'Службы и наблюдаемость', description: 'Unit-файлы, зависимости, journalctl, ресурсы и диагностика сбоев.', lessons: 6, lab: 'Восстановите nginx после OOM-события и докажите результат.' },
      { code: 'LNX.04', title: 'Автоматизация', description: 'Pipes, exit codes, переменные, циклы и безопасные Bash-скрипты.', lessons: 6, lab: 'Напишите health-check с понятным отчётом и кодами возврата.' },
    ],
  },
  {
    id: 'network-systems',
    number: '02',
    title: 'Network Systems',
    englishTitle: 'Сети, которые можно объяснить',
    description: 'Проследите путь пакета от интерфейса до приложения. Настраивайте VLAN, маршрутизацию, DNS и диагностируйте реальные разрывы.',
    outcome: 'Спроектируйте небольшую корпоративную сеть и системно находите причины потери связности.',
    level: 'БАЗОВЫЙ',
    duration: '10 НЕДЕЛЬ',
    format: '30 УРОКОВ / 4 МОДУЛЯ',
    accent: '#78dce8',
    skills: ['OSI и TCP/IP', 'VLAN и subnetting', 'Routing и NAT', 'DNS и DHCP'],
    tools: ['Wireshark', 'iproute2', 'Cisco IOS', 'BIND'],
    labId: 'network',
    modules: [
      { code: 'NET.01', title: 'Путь одного пакета', description: 'Ethernet, ARP, IP, инкапсуляция и чтение сетевого трафика.', lessons: 8, lab: 'Разберите ICMP-запрос по кадрам в Wireshark.' },
      { code: 'NET.02', title: 'Сегментация', description: 'CIDR, подсети, VLAN, trunk/access и планирование адресного пространства.', lessons: 8, lab: 'Разделите офис на три VLAN без конфликтов адресов.' },
      { code: 'NET.03', title: 'Маршруты и сервисы', description: 'Static routing, NAT, DHCP, DNS и диагностика цепочки резолвинга.', lessons: 8, lab: 'Восстановите default route и докажите внешнюю связность.' },
      { code: 'NET.04', title: 'Отказоустойчивость', description: 'Redundancy, first-hop protocols, метрики и поиск узких мест.', lessons: 6, lab: 'Переживите отказ основного канала без потери сессии.' },
    ],
  },
  {
    id: 'windows-infrastructure',
    number: '03',
    title: 'Windows Infrastructure',
    englishTitle: 'Server и Active Directory',
    description: 'Постройте управляемый Windows-домен: от первого Server-узла до групповых политик, файловых сервисов и автоматизации на PowerShell.',
    outcome: 'Разверните домен для команды из 50 человек с понятной OU-структурой и контролируемым доступом.',
    level: 'БАЗОВЫЙ',
    duration: '9 НЕДЕЛЬ',
    format: '27 УРОКОВ / 4 МОДУЛЯ',
    accent: '#a8a4ff',
    skills: ['Windows Server', 'AD DS и домены', 'GPO и OU', 'PowerShell'],
    tools: ['Windows Server 2025', 'Active Directory', 'PowerShell 7', 'Hyper-V'],
    labId: 'service',
    modules: [
      { code: 'WIN.01', title: 'Server core', description: 'Роли, хранилище, сеть, удалённое управление и базовый hardening.', lessons: 7, lab: 'Подготовьте два Server-узла к вводу в домен.' },
      { code: 'WIN.02', title: 'Active Directory', description: 'Лес, домен, контроллеры, DNS, репликация и модель доверия.', lessons: 7, lab: 'Разверните домен и устраните ошибку репликации.' },
      { code: 'WIN.03', title: 'Политики и доступ', description: 'OU, группы, GPO, NTFS и делегирование административных задач.', lessons: 7, lab: 'Примените базовую политику безопасности только к целевой OU.' },
      { code: 'WIN.04', title: 'PowerShell в работе', description: 'Объектный pipeline, CIM, удалённые сессии и массовые операции.', lessons: 6, lab: 'Автоматизируйте onboarding и аудит учётных записей.' },
    ],
  },
  {
    id: 'virtualization',
    number: '04',
    title: 'Virtual Infrastructure',
    englishTitle: 'Виртуализация и отказоустойчивость',
    description: 'Соберите вычислительный кластер, поймите цену ресурсов и научитесь переживать отказы без паники.',
    outcome: 'Спроектируйте гипервизорный кластер с резервированием, live migration и проверенным восстановлением.',
    level: 'ПРОДВИНУТЫЙ',
    duration: '8 НЕДЕЛЬ',
    format: '24 УРОКА / 4 МОДУЛЯ',
    accent: '#ff9d72',
    skills: ['KVM и Hyper-V', 'Сети и хранилища', 'HA и live migration', 'Backup / Restore'],
    tools: ['Proxmox VE', 'KVM', 'Ceph', 'Veeam'],
    labId: 'network',
    modules: [
      { code: 'VIR.01', title: 'Вычисления', description: 'Гипервизоры, CPU/Memory overcommit, шаблоны и жизненный цикл VM.', lessons: 6, lab: 'Соберите шаблон VM и измерьте цену overcommit.' },
      { code: 'VIR.02', title: 'Сеть и данные', description: 'Virtual switches, bridges, VLAN, дисковые форматы и основы Ceph.', lessons: 6, lab: 'Подключите общее хранилище и найдите I/O-узкое место.' },
      { code: 'VIR.03', title: 'Непрерывность', description: 'Quorum, fencing, HA-группы и миграция без остановки сервиса.', lessons: 6, lab: 'Отключите узел и наблюдайте контролируемый failover.' },
      { code: 'VIR.04', title: 'Восстановление', description: '3-2-1, immutable backup, RPO/RTO и регламент проверки копий.', lessons: 6, lab: 'Восстановите сервис после повреждения диска и измерьте RTO.' },
    ],
  },
]
