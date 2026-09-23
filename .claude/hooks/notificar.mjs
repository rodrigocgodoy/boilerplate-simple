// Hook Notification: avisa quando o Claude Code precisa de você.
// Um arquivo só para os três sistemas: escolhe o comando pelo process.platform.
import { execFile } from 'node:child_process'

const titulo = 'Claude Code'
const texto = 'O Claude Code precisa de você'

const comandos = {
  darwin: [
    'osascript',
    ['-e', `display notification "${texto}" with title "${titulo}"`],
  ],
  win32: [
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      `[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; [System.Windows.Forms.MessageBox]::Show('${texto}', '${titulo}')`,
    ],
  ],
  linux: ['notify-send', [titulo, texto]],
}

const escolhido = comandos[process.platform]
if (escolhido) execFile(escolhido[0], escolhido[1], () => {})
