# Aplicação de Pagamento (microservices)

Serviços:
- payment-service: expõe POST /payments, salva transação com status = pending e publica `payment.requested`.
- payment-worker: consome `payment.requested`, processa a transação (simulado), atualiza status para `success` no Postgres e publica `payment.confirmed`.
- notification-service: consome `payment.requested` e `payment.confirmed` e simula envio de notificações.

Critérios avaliativos atendidos
1. Serviços independentes:
   - payment-service, payment-worker e notification-service executam em containers separados.
   - payment-service não faz confirmação síncrona — delega ao worker.
2. Comunicação assíncrona:
   - RabbitMQ (exchange `payments_exchange`) transporta mensagens `payment.requested` e `payment.confirmed`.
   - Mensagens duráveis e ack/manual (retries via nack/requeue).
3. Fluxo de processamento:
   - POST /payments -> salva (pending) + publica `payment.requested`.
   - payment-worker consome `payment.requested`, processa, atualiza DB para `success` e publica `payment.confirmed`.
   - notification-service consome ambos os eventos e registra notificações.

Executar
1. Docker e Docker Compose instalados.
2. Na pasta do projeto (c:\Users\Humbe\Desktop\Aplicacao-de-pagamento):
   docker-compose up --build
3. Criar pagamento (exemplo):
   curl -X POST http://localhost:3000/payments -H "Content-Type: application/json" -d "{\"amount\":100,\"userEmail\":\"cliente@exemplo.com\"}"
4. Ver notificações:
   http://localhost:3001/notifications

Endpoints úteis
- payment-service:
  - POST /payments
  - GET /payments/:id
  - GET /health
- notification-service:
  - GET /notifications
  - GET /health (padrão já pode ser adicionado se necessário)

Observações e próximos passos recomendados
- Em produção:
  - Implementar DLQ (dead-letter) para mensagens que falham repetidamente.
  - Adicionar autenticação e variáveis de ambiente seguras.
  - Substituir simulação por integração com gateway de pagamentos.
  - Implementar métricas e healthchecks mais robustos.