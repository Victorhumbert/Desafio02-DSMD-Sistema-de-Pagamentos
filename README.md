# 🚀 Desafio02-DSMD - Sistema de Pagamentos

Um sistema de microserviços para processamento de pagamentos usando Node.js, PostgreSQL e RabbitMQ.

📋 Pré-requisitos
- Docker
- Docker Compose

🏗️ Arquitetura
O projeto é composto pelos seguintes serviços e arquivos principais:

- Payment Service (API + worker)
  - [payment-service/index.js](payment-service/index.js) — servidor HTTP (usa [`db.initDb`](payment-service/db.js) e [`publisher.connect`](payment-service/publisher.js))
  - [payment-service/worker.js](payment-service/worker.js) — worker que consome `payment.requested` e chama [`paymentService.confirm`](payment-service/services/paymentService.js)
  - [payment-service/services/paymentService.js](payment-service/services/paymentService.js) — [`paymentService.create`](payment-service/services/paymentService.js), [`paymentService.findById`](payment-service/services/paymentService.js), [`paymentService.confirm`](payment-service/services/paymentService.js)
  - [payment-service/db.js](payment-service/db.js) — funções de banco: [`initDb`](payment-service/db.js), [`createPayment`](payment-service/db.js), [`updatePaymentStatus`](payment-service/db.js), [`getPayment`](payment-service/db.js)
  - [payment-service/publisher.js](payment-service/publisher.js) — [`publisher.connect`](payment-service/publisher.js), [`publisher.send`](payment-service/publisher.js)
  - [payment-service/controllers/paymentController.js](payment-service/controllers/paymentController.js)
  - [payment-service/routes/payments.js](payment-service/routes/payments.js)
  - [payment-service/models/paymentModel.js](payment-service/models/paymentModel.js)
  - [payment-service/package.json](payment-service/package.json)
  - [payment-service/Dockerfile](payment-service/Dockerfile)
  - [payment-service/worker.Dockerfile](payment-service/worker.Dockerfile)

- Notification Service
  - [notification-service/index.js](notification-service/index.js) — servidor HTTP (inicia [`notification-service/consumer.js`](notification-service/consumer.js) e [`notification-service/publisher.js`](notification-service/publisher.js))
  - [notification-service/consumer.js](notification-service/consumer.js) — consumidor que grava via [`notificationService.record`](notification-service/services/notificationService.js)
  - [notification-service/services/notificationService.js](notification-service/services/notificationService.js) — [`notificationService.record`](notification-service/services/notificationService.js), [`notificationService.list`](notification-service/services/notificationService.js)
  - [notification-service/publisher.js](notification-service/publisher.js)
  - [notification-service/controllers/notificationController.js](notification-service/controllers/notificationController.js)
  - [notification-service/routes/notifications.js](notification-service/routes/notifications.js)
  - [notification-service/package.json](notification-service/package.json)
  - [notification-service/Dockerfile](notification-service/Dockerfile)

- Orquestração
  - [docker-compose.yml](docker-compose.yml)
- Outros
  - [.gitignore](.gitignore)

Ports e credenciais (padrão do compose)
- Payment Service: http://localhost:3000
- Notification Service: http://localhost:3001
- RabbitMQ Management: http://localhost:15672 (usuário: guest / senha: guest)
- PostgreSQL: localhost:5432 (usuário: pguser / senha: pgpass / db: paymentsdb)
  - string usada no compose: `postgres://pguser:pgpass@postgres:5432/paymentsdb`

🚀 Como executar

1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd Desafio02-DSMD || cd Aplicacao-de-pagamento
```

2. Suba os serviços (Docker Compose)
```bash
docker compose build --no-cache
docker compose up -d
```

3. ⚠️ IMPORTANTE: inicialização do banco
- O serviço `payment-service` já chama [`initDb`](payment-service/db.js) automaticamente em [payment-service/index.js](payment-service/index.js) para criar a tabela `payments` e triggers.
- Se precisar forçar a criação/diagnóstico manualmente, entre no container e execute:
```bash
# Entre no container do payment-service
docker exec -it payment-service sh

# Dentro do container (no diretório /app):
node -e "require('./db').initDb().then(()=>console.log('initDb ok')).catch(err=>{console.error(err);process.exit(1)})"

# Saia
exit
```

4. Verifique se está funcionando
- Payment Service: http://localhost:3000
  - POST /payments — controlador: [`paymentController.createPayment`](payment-service/controllers/paymentController.js)
  - GET /payments/:id — controlador: [`paymentController.getPayment`](payment-service/controllers/paymentController.js)
- Notification Service: http://localhost:3001
  - GET /notifications — controlador: [`notificationController.list`](notification-service/controllers/notificationController.js)
- RabbitMQ Management: http://localhost:15672 (guest/guest)

📊 Comandos úteis

Verificar status dos containers
```bash
docker compose ps
```

Ver logs (follow)
```bash
docker compose logs -f payment-service
docker compose logs -f payment-worker
docker compose logs -f notification-service
```

Criar pagamento (exemplo)
```bash
curl -s -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"userEmail":"cliente@exemplo.com"}'
```

Consultar pagamento (substitua <ID>)
```bash
curl http://localhost:3000/payments/<ID>
```

Listar notificações
```bash
curl http://localhost:3001/notifications
```

Ver tabela payments dentro do container Postgres
```bash
docker compose exec postgres psql -U pguser -d paymentsdb -c "SELECT id,user_email,amount,status,created_at,updated_at FROM payments ORDER BY created_at DESC LIMIT 10;"
```

Reiniciar apenas payment-service
```bash
docker compose restart payment-service
```

Parar todos os serviços
```bash
docker compose down
```

Limpar volumes (⚠️ apaga dados do banco)
```bash
docker compose down -v
```

🔧 Desenvolvimento local (sem Docker)
Para rodar cada serviço localmente:
```bash
# Ex.: payment-service
cd payment-service
npm install
export DATABASE_URL=postgres://pguser:pgpass@localhost:5432/paymentsdb
export RABBITMQ_URL=amqp://guest:guest@localhost:5672
export PORT=3000
npm start
```
Repita para `notification-service` (porta 3001). O worker pode ser executado localmente com `node worker.js` em `payment-service`.

🗄️ Banco de Dados
O esquema e criação da tabela `payments` são realizados em [payment-service/db.js](payment-service/db.js) pela função [`initDb`](payment-service/db.js). A tabela criada é:

- payments (id TEXT PK, amount NUMERIC, user_email TEXT, status TEXT, created_at, updated_at)
- Trigger `set_timestamp_trigger` atualiza `updated_at` automaticamente.

🔍 Fluxo resumido
- POST /payments -> [`paymentService.create`](payment-service/services/paymentService.js) grava via [`createPayment`](payment-service/db.js) e publica `payment.requested` com [`publisher.send`](payment-service/publisher.js).
- `payment-worker` ([payment-service/worker.js](payment-service/worker.js)) consome `payment.requested`, processa e chama [`paymentService.confirm`](payment-service/services/paymentService.js) que atualiza DB e publica `payment.confirmed`.
- `notification-service` ([notification-service/consumer.js](notification-service/consumer.js)) consome ambos eventos e registra via [`notificationService.record`](notification-service/services/notificationService.js).

🐛 Troubleshooting

- Container `payment-service` não inicia
  - Verifique se o banco está saudável: `docker compose ps`
  - Verifique logs: `docker compose logs payment-service -f`
  - Verifique se [`initDb`](payment-service/db.js) executou ou rode manualmente (veja seção de inicialização manual).

- Erro AMQP / RabbitMQ
  - Aguarde alguns segundos após subir os containers (RabbitMQ precisa iniciar).
  - Verifique logs: `docker compose logs rabbitmq -f`
  - Verifique conexões nos serviços: [`payment-service/publisher.js`](payment-service/publisher.js), [`notification-service/publisher.js`](notification-service/publisher.js) e [`notification-service/consumer.js`](notification-service/consumer.js) implementam reconexão.

- Dados não aparecendo no Postgres
  - Confirme que a string `DATABASE_URL` em [docker-compose.yml](docker-compose.yml) está correta.
  - Rode a query de verificação (veja seção comandos úteis).

👥 Contribuição
1. Faça um fork do projeto
2. Crie uma branch: `git checkout -b feature/nome-da-feature`
3. Commit: `git commit -m "Descrição"`
4. Push e abra um Pull Request

📝 Observação final
- Não há Prisma neste projeto; a inicialização do schema é feita em [payment-service/db.js](payment-service/db.js) pela função [`initDb`](payment-service/db.js). Lembre-se de garantir que o Postgres esteja pronto antes de iniciar os serviços para que a criação da tabela ocorra corretamente.