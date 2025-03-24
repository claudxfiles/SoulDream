import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email HTML template
const createEmailHtml = (name: string, email: string, subject: string, message: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nuevo contacto de SoulDream</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
    }
    .container {
      border: 1px solid #e0e0e0;
      border-radius: 5px;
      padding: 20px;
      margin: 20px 0;
    }
    .header {
      background-color: #4f46e5;
      color: white;
      padding: 10px 20px;
      border-radius: 5px 5px 0 0;
      margin: -20px -20px 20px;
    }
    .field {
      margin-bottom: 15px;
    }
    .label {
      font-weight: bold;
      color: #666;
    }
    .message {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
      margin-top: 5px;
    }
    .footer {
      color: #999;
      font-size: 12px;
      margin-top: 30px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Nuevo mensaje de contacto</h2>
    </div>
    
    <div class="field">
      <div class="label">Nombre:</div>
      <div>${name}</div>
    </div>
    
    <div class="field">
      <div class="label">Email:</div>
      <div>${email}</div>
    </div>
    
    <div class="field">
      <div class="label">Asunto:</div>
      <div>${subject}</div>
    </div>
    
    <div class="field">
      <div class="label">Mensaje:</div>
      <div class="message">${message}</div>
    </div>
    
    <div class="footer">
      Este mensaje fue enviado desde el formulario de contacto de SoulDream.
    </div>
  </div>
</body>
</html>
`;

export async function POST(req: NextRequest) {
  try {
    console.log('Starting email sending process...');
    
    // Parse the request body
    const { name, email, subject, message } = await req.json();
    console.log('Form data received:', { name, email, subject });

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    // Check if Resend API key is available
    if (!process.env.RESEND_API_KEY) {
      console.error('Resend API key is missing');
      return NextResponse.json(
        { error: 'Error de configuración: API key no disponible' },
        { status: 500 }
      );
    }

    // Generate HTML email
    const htmlContent = createEmailHtml(name, email, subject, message);

    console.log('Attempting to send email with Resend...');
    // Send email using Resend
    try {
      // For testing, use Resend's default testing address which doesn't need domain verification
      // In production, you should use your own verified domain
      const fromValidated = 'onboarding@resend.dev';
      
      // Use claudio.alcaman@gmail.com as the recipient email
      const toEmail = 'claudio.alcaman@gmail.com';
      
      console.log('Sending email with config:', {
        from: fromValidated,
        to: toEmail,
        subject: `Nuevo contacto: ${subject}`,
        replyTo: email
      });
      
      const { data, error } = await resend.emails.send({
        from: fromValidated,
        to: [toEmail],
        subject: `Nuevo contacto: ${subject}`,
        replyTo: email,
        html: htmlContent,
        text: `
          Nombre: ${name}
          Email: ${email}
          Asunto: ${subject}
          
          Mensaje:
          ${message}
        `,
      });

      if (error) {
        console.error('Resend API returned an error:', error);
        return NextResponse.json(
          { error: `Error al enviar el email: ${error.message}` },
          { status: 500 }
        );
      }

      console.log('Email sent successfully:', data);
      return NextResponse.json(
        { success: true, message: 'Email enviado correctamente', data },
        { status: 200 }
      );
    } catch (sendError) {
      console.error('Exception during Resend API call:', sendError);
      return NextResponse.json(
        { error: `Error durante el envío: ${sendError instanceof Error ? sendError.message : 'Error desconocido'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: `Error interno del servidor: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
} 