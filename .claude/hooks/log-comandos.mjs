// Hook PostToolUse (matcher Bash): registra cada comando que a IA executou.
// Depois é só abrir .claude/comandos.log para auditar.
import { appendFileSync } from 'node:fs'

let entrada = ''
process.stdin.setEncoding('utf8')
for await (const pedaco of process.stdin) entrada += pedaco

const { tool_input: toolInput = {} } = JSON.parse(entrada || '{}')
const raiz = process.env.CLAUDE_PROJECT_DIR ?? '.'
appendFileSync(
  `${raiz}/.claude/comandos.log`,
  `${new Date().toISOString()}  ${toolInput.command ?? ''}\n`,
)
