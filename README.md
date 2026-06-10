# WhatsApp AutoFlow Claude v2

Plataforma de automacao de WhatsApp para gestao de clientes, com esteira de
onboarding, mensagens recorrentes, respostas automaticas, templates e agendamentos.

## O que a aplicacao faz

- **Gestao de Clientes**: cadastro de contatos com vencimento, etapas e assinatura.
- **Esteira de Producao**: onboarding em estagios (Semana 1, 2, 3, Renovados, Encerrados).
- **Automacoes**: mensagens recorrentes via cron + timezone, com janela de silencio.
- **Respostas Automaticas**: regras de resposta por palavra-chave.
- **Templates**: mensagens reutilizaveis com variaveis dinamicas (ex: {{nome}}).
- **Agendamentos**: mensagens unicas em data e hora especificas.
- **Auditoria** e **Backup/Importacao** de dados por aba.

## Arquitetura

Stack completa em Docker Compose:

| Componente | Tecnologia | Papel |
|------------|-----------|-------|
| `web/` | React + Vite + nginx | Frontend SPA (tema Premium) |
| `api/` | Express | API REST principal |
| `worker/` | BullMQ | Processamento de filas/jobs |
| `wa-gateway/` | Baileys | Conexao com o WhatsApp |
| MongoDB | mongo:6 | Banco de dados (`wa_admin`) |
| Redis | redis | Fila e cache |
| Caddy | caddy:2 | Reverse proxy + HTTPS automatico |

> O codigo da stack fica em `whatsapp-autoflow/`. Veja o README dessa pasta
> para detalhes tecnicos de cada servico.

## Como rodar

```bash
git clone https://github.com/ricieri30/WhatsApp_AutoFlow_claudev2.git
cd WhatsApp_AutoFlow_claudev2/whatsapp-autoflow
# criar o arquivo .env (JWT_SECRET, etc) - nao vem versionado
docker compose up -d
```

## Documentacao

- **Deploy, recuperacao e backup**: veja [`whatsapp-autoflow/DEPLOY.md`](whatsapp-autoflow/DEPLOY.md).
- **Detalhes da stack e status dos servicos**: veja [`whatsapp-autoflow/README.md`](whatsapp-autoflow/README.md).

## Seguranca

- O `.env` (com `JWT_SECRET`) NAO e versionado no Git.
- Backups do MongoDB e a sessao do WhatsApp devem ser tratados como dados sensiveis.
