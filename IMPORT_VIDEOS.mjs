import { copyFileSync, constants, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, extname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// This script only copies supported MP4s. It never moves or changes originals.
const projectRoot = dirname(fileURLToPath(import.meta.url))
const input = process.argv[2]
if (!input) {
  console.error('Usage: node IMPORT_VIDEOS.mjs "C:\\path\\to\\Видеоматериалы"')
  process.exit(1)
}
const videosFolder = isAbsolute(input) ? input : resolve(process.cwd(), input)
if (!existsSync(videosFolder)) {
  console.error('Folder not found:', videosFolder)
  process.exit(1)
}
const files = readdirSync(videosFolder, { withFileTypes: true })
  .filter(entry => entry.isFile() && extname(entry.name).toLowerCase() === '.mp4')
  .map(entry => ({ file: entry.name, normalized: entry.name.toLowerCase().normalize('NFKC').replaceAll('ё', 'е') }))

// Patterns accept the names shown in the user's Windows folder.
// Don't match by file index: lesson order can change in later patches.
const jobs = [
  { label: 'Сетевое оборудование', dest: 'public/videos/academy/router-switch-hub.mp4', matches: name => /маршрутизатор|коммутатор|router|switch|hub/.test(name) },
  { label: 'Windows Server', dest: 'public/videos/academy/windows-server.mp4', matches: name => /windows[_ .-]*server/.test(name) },
  { label: 'IP-адрес', dest: 'public/videos/ip-address.mp4', matches: name => /(^|[^a-zа-я0-9])ip([^a-zа-я0-9]|$)|ip[_ .-]*адр/.test(name) },
  { label: 'MAC-адрес', dest: 'public/videos/academy/mac-address.mp4', matches: name => /mac|мак[_ .-]*адр/.test(name) },
  { label: 'Маска подсети', dest: 'public/videos/academy/subnet-mask.mp4', matches: name => /маска[_ .-]*подсет|subnet[_ .-]*mask/.test(name) },
  { label: 'Модель OSI', dest: 'public/videos/academy/osi-seven-layers.mp4', matches: name => /osi|модель[_ .-]*оси/.test(name) },
  { label: 'TCP / UDP', dest: 'public/videos/academy/tcp-udp.mp4', matches: name => /tcp|udp/.test(name) },
  { label: 'DNS', dest: 'public/videos/academy/dns.mp4', matches: name => /dns/.test(name) },
  { label: 'DHCP', dest: 'public/videos/academy/dhcp.mp4', matches: name => /dhcp/.test(name) },
  { label: 'NAT', dest: 'public/videos/academy/nat.mp4', matches: name => /nat/.test(name) },
  { label: 'SSL / TLS', dest: 'public/videos/academy/ssl-tls.mp4', matches: name => /ssl|tls/.test(name) },
  { label: 'Собеседования', dest: 'public/videos/academy/interviews.mp4', matches: name => /собесед|interview/.test(name) },
]

let copied = 0
let present = 0
let missing = 0
for (const job of jobs) {
  const source = files.find(f => job.matches(f.normalized))
  const target = join(projectRoot, job.dest)
  if (existsSync(target)) {
    present++
    console.log('[УЖЕ ЕСТЬ]', job.label)
    continue
  }
  if (!source) {
    missing++
    console.log('[НЕ НАЙДЕНО]', job.label)
    continue
  }
  mkdirSync(dirname(target), { recursive: true })
  try {
    copyFileSync(join(videosFolder, source.file), target, constants.COPYFILE_EXCL)
    copied++
    console.log('[ДОБАВЛЕНО]', job.label, '<-', source.file)
  } catch (error) {
    console.error('[ОШИБКА]', job.label, error.message)
    process.exitCode = 1
  }
}
console.log(`\nГотово: добавлено ${copied}, уже было ${present}, не найдено ${missing}.`)
console.log('Файлы оригиналов в папке Видеоматериалы не изменены.')
if (missing > 0) console.log('Отсутствующие видео можно добавить позже; маски подсети нет на предоставленном скриншоте.')
