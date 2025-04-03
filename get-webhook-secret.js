import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: './frontend/.env.local' });

const PAYPAL_CLIENT_ID = 'AcA-7lyAMhjSYYfW9KFSKIQTGqSHYXx-0KPt5UwAHB1Q_XLWRkvS33mM6caUqkDLn10lixwu4e1fT77m';
const PAYPAL_CLIENT_SECRET = 'EHvW0SB1dMLboUOMzY3Rsqp9aooFySyPaM2r1jMRNPiBDQyeV-vd872BXWh8u5ko8FWjnvyZBFfTFymG';
const WEBHOOK_ID = '69965191J95513931';
const SANDBOX = true;

const BASE_URL = SANDBOX 
  ? 'https://api-m.sandbox.paypal.com' 
  : 'https://api-m.paypal.com';

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

async function getWebhookSecret() {
  try {
    const accessToken = await getAccessToken();
    console.log('Access Token obtenido');
    
    // Intentamos obtener el webhook signing key
    const response = await fetch(`${BASE_URL}/v1/notifications/webhooks/${WEBHOOK_ID}/signing-key`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status de la respuesta:', response.status);
    const data = await response.json();
    
    if (data.signing_key) {
      console.log('\n=================================');
      console.log('WEBHOOK SECRET ENCONTRADO:');
      console.log(data.signing_key);
      console.log('=================================\n');
    } else {
      console.log('\nRespuesta completa:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

getWebhookSecret(); 