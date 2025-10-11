# Aplicação de Pagamento (microservices)

Descrição breve
- Sistema composto por 3 serviços independentes:
  - payment-service: API REST para criar e consultar pagamentos (salva em Postgres e publica evento `payment.requested`).
  - payment-worker: consumidor que processa pagamentos (confirma, atualiza DB e publica `payment.confirmed`).
  - notification-service: consumidor que recebe eventos `payment.requested` e `payment.confirmed` e registra notificações.
- Comunicação assíncrona via RabbitMQ (exchange `payments_exchange`, filas `payment_requested`, `payment_confirmed`).

Requisitos
- Docker Desktop (Windows) ou Docker Engine + Docker Compose
- Porta 3000 (payment-service), 3001 (notification-service), RabbitMQ UI 15672, Postgres 5432

Como executar
1. Certifique-se de que o Docker Desktop está em execução.
2. Na pasta do projeto:
```bash
cd C:\Users\Humbe\Desktop\Aplicacao-de-pagamento
docker compose build --no-cache
docker compose up -d
```

Endpoints principais
- payment-service
  - POST /payments
    - Body JSON: { "amount": 100, "userEmail": "cliente@exemplo.com" }
    - Retorna: { "id": "...", "status": "pending" }
  - GET /payments/:id
- notification-service
  - GET /notifications

Teste rápido (exemplo)
```bash
# criar pagamento
curl -s -X POST http://localhost:3000/payments -H "Content-Type: application/json" -d '{"amount":100,"userEmail":"cliente@exemplo.com"}'

# consultar pagamento (substituir <ID>)
curl http://localhost:3000/payments/<ID>

# listar notificações
curl http://localhost:3001/notifications
```

Verificação e utilitários
- RabbitMQ UI: http://localhost:15672 (usuário: guest / senha: guest)
- Ver tabela payments no Postgres (dentro do container):
```bash
docker compose exec postgres psql -U pguser -d paymentsdb -c "SELECT id,user_email,amount,status,created_at,updated_at FROM payments ORDER BY created_at DESC LIMIT 10;"
```

Parar e remover
```bash
docker compose down
```

Observações
- Fluxo assíncrono implementado: POST -> payment.requested -> worker processa -> DB atualizado para success -> payment.confirmed -> notification recebe ambos os eventos.
- Para builds reprodutíveis, inclua package-lock.json nos diretórios dos serviços ou ajuste Dockerfiles conforme necessário.