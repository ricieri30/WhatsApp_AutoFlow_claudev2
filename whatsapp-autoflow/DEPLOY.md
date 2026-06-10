# Deploy e Recuperacao - WhatsApp AutoFlow

Guia para subir uma versao paralela/nova SEM afetar a producao e para
restaurar dados a partir de um backup do MongoDB.

## Topologia

- **Producao** (NAO TOCAR): projeto `whatsapp_autoflow_claude`, containers `autoflow2_*`, porta interna 3025.
- **Nova/Teste**: projeto `autoflow_claude_2v`, porta 4025 (exposta), volumes proprios e isolados.

## Regras de ouro

1. NUNCA conectar 2 stacks ao MESMO numero de WhatsApp ao mesmo tempo (corrompe a sessao Baileys).
2. NUNCA deletar os containers `autoflow2_*` nem o projeto `whatsapp_autoflow_claude` (producao).
3. NUNCA usar `docker compose down -v` na producao (apaga os volumes/dados).
4. O `.env` (com JWT_SECRET) NAO vem do Git. Recriar manualmente na pasta antes de subir.
5. Sempre ter backup do Mongo + snapshot da VPS antes de promover qualquer coisa.

## 1. Clonar e preparar

```bash
cd /root
git clone https://github.com/ricieri30/WhatsApp_AutoFlow_claudev2.git autoflow_v2_teste
cd autoflow_v2_teste/whatsapp-autoflow
# Recriar o .env aqui (JWT_SECRET, etc). Ele NAO esta no Git.
nano .env
```

## 2. Subir o stack isolado (projeto + porta + volumes proprios)

```bash
docker compose -p autoflow_claude_2v up -d
docker compose -p autoflow_claude_2v ps
```

Acessar depois em: http://SEU_IP:4025

## 3. Restaurar o backup do Mongo no banco novo

```bash
# Ajuste o caminho do backup conforme a data do dump
BKP=/root/backups/autoflow2_AAAAMMDD_HHMMSS/wa_admin
NOVO_MONGO=$(docker ps --format '{{.Names}}' | grep autoflow_claude_2v | grep mongo)

docker cp $BKP $NOVO_MONGO:/tmp/restore_src
docker exec $NOVO_MONGO mongorestore --drop --db=wa_admin /tmp/restore_src
```

## 4. Conectar o WhatsApp

Conectar a sessao via QR na UI (aba WhatsApp) SOMENTE quando for testar,
e idealmente com a producao pausada nesse momento (uma sessao por numero).

## Como gerar um backup novo da producao (read-only, seguro)

```bash
TS=$(date +%Y%m%d_%H%M%S)
mkdir -p /root/backups/autoflow2_$TS
docker exec autoflow2_mongo sh -c 'rm -rf /tmp/dump_wa && mongodump --db=wa_admin --out=/tmp/dump_wa'
docker cp autoflow2_mongo:/tmp/dump_wa/wa_admin /root/backups/autoflow2_$TS/
docker exec autoflow2_mongo rm -rf /tmp/dump_wa
```

## Recarregar do zero (incidente)

```bash
cd /root/autoflow_v2_teste/whatsapp-autoflow
docker compose -p autoflow_claude_2v down        # SEM -v (preserva volumes)
docker compose -p autoflow_claude_2v up -d
# se precisar repor dados, repetir o passo 3 (restore)
```
