import dotenv from 'dotenv';
import fetch from 'node-fetch';

const PAYPAL_CLIENT_ID = 'AcA-7lyAMhjSYYfW9KFSKIQTGqSHYXx-0KPt5UwAHB1Q_XLWRkvS33mM6caUqkDLn10lixwu4e1fT77m';
const PAYPAL_CLIENT_SECRET = 'EHvW0SB1dMLboUOMzY3Rsqp9aooFySyPaM2r1jMRNPiBDQyeV-vd872BXWh8u5ko8FWjnvyZBFfTFymG';
const WEBHOOK_URL = 'https://api.presentandflow.cl/api/payments/webhook';
const SANDBOX = true;

const BASE_URL = SANDBOX 
  ? 'https://api.sandbox.paypal.com' // Nota: usando api.sandbox en lugar de api-m.sandbox
  : 'https://api.paypal.com';

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await response.json();
  return data.access_token;
}

async function createWebhook() {
  try {
    const accessToken = await getAccessToken();
    console.log('Access Token obtenido');
    
    // Creamos el nuevo webhook
    console.log('Creando nuevo webhook...');
    const response = await fetch(`${BASE_URL}/v1/notifications/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': Date.now().toString() // Agregando un ID único
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        event_types: [
          { name: "BILLING.SUBSCRIPTION.ACTIVATED" },
          { name: "BILLING.SUBSCRIPTION.CANCELLED" },
          { name: "BILLING.SUBSCRIPTION.CREATED" },
          { name: "BILLING.SUBSCRIPTION.EXPIRED" },
          { name: "BILLING.SUBSCRIPTION.RE-ACTIVATED" },
          { name: "BILLING.SUBSCRIPTION.SUSPENDED" },
          { name: "BILLING.SUBSCRIPTION.UPDATED" },
          { name: "PAYMENT.SALE.COMPLETED" },
          { name: "PAYMENT.SALE.DENIED" },
          { name: "PAYMENT.SALE.PENDING" }
        ]
      })
    });
    
    console.log('Status de la respuesta:', response.status);
    const data = await response.json();
    console.log('\nRespuesta completa:', JSON.stringify(data, null, 2));
    
    if (data.id) {
      // Intentamos obtener el webhook secret inmediatamente
      console.log('\nObteniendo webhook secret...');
      const secretResponse = await fetch(`${BASE_URL}/v1/webhooks/${data.id}/verify-webhook-signature-cert`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const secretData = await secretResponse.json();
      console.log('Respuesta de secret:', JSON.stringify(secretData, null, 2));
      
      console.log('\n=================================');
      console.log('INFORMACIÓN DEL WEBHOOK:');
      console.log('Webhook ID:', data.id);
      if (secretData.cert) {
        console.log('Webhook Secret:', secretData.cert);
      }
      console.log('=================================\n');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createWebhook(); 