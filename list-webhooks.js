import dotenv from 'dotenv';
import fetch from 'node-fetch';

const PAYPAL_CLIENT_ID = 'AcA-7lyAMhjSYYfW9KFSKIQTGqSHYXx-0KPt5UwAHB1Q_XLWRkvS33mM6caUqkDLn10lixwu4e1fT77m';
const PAYPAL_CLIENT_SECRET = 'EHvW0SB1dMLboUOMzY3Rsqp9aooFySyPaM2r1jMRNPiBDQyeV-vd872BXWh8u5ko8FWjnvyZBFfTFymG';
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

async function listWebhooks() {
  try {
    const accessToken = await getAccessToken();
    console.log('Access Token obtenido');
    
    const response = await fetch(`${BASE_URL}/v1/notifications/webhooks`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status de la respuesta:', response.status);
    const data = await response.json();
    console.log('Webhooks encontrados:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

listWebhooks(); 