1. Endpoints que DEBEN MOVERSE al Backend:
1.	Endpoints de IA (`/api/v1/ai/`):
   -	`/api/v1/ai/openrouter-chat`
   -	`/api/v1/ai/generate-personalized-plan`
Razón: Procesamiento pesado y manejo de tokens de API sensibles.
2.	Endpoints de Suscripciones (`/api/v1/subscriptions/`):
   -	`/api/v1/subscriptions/create`
   -	`/api/v1/subscriptions/cancel`
   -	`/api/v1/subscriptions/update`
Razón: Lógica de negocio crítica y manejo de datos sensibles.
3.	Endpoints de Calendario (`/api/v1/calendar/`):
   -	Todas las operaciones CRUD del calendario
Razón: Sincronización con Google Calendar y manejo de tokens.
2. Endpoints que DEBEN QUEDARSE en Frontend:
1.	Endpoints de Autenticación (`/api/v1/auth/)`:
   -	`/api/v1/auth/refresh-token`
   -	`/api/v1/auth/repair-tokens`
   -	`/api/v1/auth/reconnect`
Razón: Manejo de sesiones del cliente y tokens.
2.	Endpoints de PayPal (`/api/paypal/)`:
   -	`/api/paypal/create-order`
   -	`/api/paypal/capture-payment`
Razón: Integración directa con el cliente de PayPal.
3. Lo que falta implementar:

1.	En el Backend:
python
```tsx
   # Nuevos endpoints necesarios
   /api/v1/goals/           # CRUD de metas
   /api/v1/habits/          # CRUD de hábitos
   /api/v1/analytics/       # Análisis de datos
   /api/v1/notifications/   # Sistema de notificaciones
```
2. Middleware de Seguridad:

```tsx
   # backend/app/middleware/security.py
   - Rate limiting
   - Validación de tokens
   - Logging de seguridad
```
3. Validaciones:

```tsx
   # backend/app/schemas/
   - Validación de datos de entrada
   - Sanitización de datos
   - Tipado fuerte
```
4. Servicios de Cache:

```tsx
   # backend/app/services/cache.py
   - Cache para respuestas de IA
   - Cache para datos frecuentes
```

5. Sistema de Logs

```tsx
   # backend/app/core/logging.py
   - Logs estructurados
   - Monitoreo de errores
   - Tracking de performance
```

6. Tests

```tsx
   # backend/tests/
   - Tests unitarios
   - Tests de integración
   - Tests de carga
```