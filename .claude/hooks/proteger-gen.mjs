// Hook PreToolUse (matcher Edit|Write): barra edição em código gerado.
// O Claude Code manda um JSON pela entrada padrão com o arquivo que vai ser editado.
// exit 0 = deixa passar. exit 2 = bloqueia, e o que for escrito no stderr vira o aviso que a IA lê.
let entrada = ''
process.stdin.setEncoding('utf8')
for await (const pedaco of process.stdin) entrada += pedaco

const { tool_input: toolInput = {} } = JSON.parse(entrada || '{}')
const arquivo = String(toolInput.file_path ?? '').replaceAll('\\', '/')

const PROTEGIDOS = [
  'packages/api-client/gen/',
  'packages/database/generated/',
  'pnpm-lock.yaml',
]

const alvo = PROTEGIDOS.find((p) => arquivo.includes(p))
if (alvo) {
  console.error(
    `Bloqueado pelo hook: "${arquivo}" é código gerado (${alvo}). Não edite na mão — regenere com o comando do projeto (pnpm openapi && pnpm api-client, ou pnpm db:generate).`,
  )
  process.exit(2)
}
process.exit(0)
