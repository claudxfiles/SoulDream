# Configuración de PayPal para SoulDream

Este documento describe cómo configurar la integración con PayPal para el sistema de suscripciones de SoulDream.

## 1. Crear una cuenta de desarrollador en PayPal

Si aún no tienes una cuenta de desarrollador en PayPal:

1. Ve a [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Crea una cuenta o inicia sesión con tu cuenta de PayPal existente
3. Accede al Dashboard de Desarrollador

## 2. Obtener credenciales para Sandbox (pruebas)

Para probar la integración sin realizar pagos reales:

1. En el Dashboard de Desarrollador, ve a "My Apps & Credentials"
2. Selecciona la pestaña "Sandbox"
3. Haz clic en "Create App"
4. Asigna un nombre a tu aplicación (por ejemplo, "SoulDream Sandbox")
5. Selecciona un tipo de cuenta de negocio
6. Haz clic en "Create App"
7. Una vez creada, verás tus credenciales: Client ID y Secret

## 3. Configurar variables de entorno

En tu archivo `.env.local` del proyecto, agrega las siguientes variables:

```
# Para entorno de pruebas (Sandbox)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=tu_client_id_de_sandbox
PAYPAL_CLIENT_SECRET=tu_secret_de_sandbox
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Para producción (cuando estés listo para ir a producción)
# NEXT_PUBLIC_PAYPAL_CLIENT_ID=tu_client_id_de_produccion
# PAYPAL_CLIENT_SECRET=tu_secret_de_produccion
# NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

## 4. Cuentas de prueba para Sandbox

Para probar pagos en el entorno Sandbox:

1. En el Dashboard de Desarrollador, ve a "Sandbox" > "Accounts"
2. Aquí encontrarás cuentas de prueba predefinidas (o puedes crear nuevas)
3. Para cada cuenta encontrarás:
   - Email
   - Password (o "System Generated Password" que puedes ver)
   - Tipo (Personal o Business)
   - Balance

Utiliza estas cuentas para probar tu integración sin realizar pagos reales.

## 5. Configurar Webhooks (Opcional pero recomendado)

Para recibir notificaciones de eventos de PayPal (suscripciones renovadas, canceladas, etc.):

1. En el Dashboard, ve a "Webhooks"
2. Haz clic en "Add Webhook"
3. En "Webhook URL" ingresa: `https://tu-dominio.com/api/paypal/webhooks`
4. Selecciona los eventos que quieres recibir (recomendado para suscripciones):
   - `PAYMENT.SALE.COMPLETED`
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.UPDATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.EXPIRED`
5. Guarda la configuración

## 6. Migrar a producción

Cuando estés listo para ir a producción:

1. En el Dashboard, ve a la pestaña "Live"
2. Sigue los mismos pasos que para Sandbox para crear una aplicación en modo "Live"
3. Obtén las credenciales de producción (Client ID y Secret)
4. Actualiza tus variables de entorno con estas credenciales
5. Asegúrate de cambiar la URL de `localhost:3000` a tu dominio real
6. Configura los webhooks para la URL de producción

## 7. Limitaciones del Sandbox

Ten en cuenta algunas limitaciones del entorno Sandbox:

- Las transacciones son más lentas que en producción
- Algunos errores solo aparecen en producción
- Las cuentas Sandbox tienen fondos limitados
- Algunas características avanzadas podrían no estar disponibles en Sandbox

## 8. Probando la integración

Para probar la integración:

1. Inicia sesión en tu aplicación
2. Ve a la página de planes (/pricing)
3. Selecciona un plan
4. En la ventana de pago de PayPal, usa las credenciales de una cuenta Sandbox
5. Completa el proceso y verifica que tu suscripción se active correctamente
6. Verifica que el nivel de suscripción se actualice en tu perfil

## 9. Solución de problemas comunes

Si enfrentas problemas:

1. **Error "Invalid Client ID"**: Verifica que estás usando el Client ID correcto para el entorno (Sandbox o Live)
2. **Error 401**: Revisa tu Client Secret
3. **El botón de PayPal no aparece**: Asegúrate de que el script de PayPal se está cargando correctamente
4. **Webhooks no recibidos**: Verifica la URL y que tu servidor sea accesible desde internet
5. **Las suscripciones no se activan**: Revisa los logs en el Dashboard de Developer para ver errores detallados 