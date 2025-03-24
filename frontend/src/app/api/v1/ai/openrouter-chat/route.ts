import { NextResponse } from 'next/server';
import { classifyAreaAndType } from '@/lib/ai/classification';
import { generatePlanSteps, generateTimeframe } from '@/lib/ai/planning';
import { generateConversationalResponse } from '@/lib/ai/conversation';

// Esta es una implementación simulada ya que no tenemos acceso real a OpenRouter
// En una implementación real, necesitarías una clave API de OpenRouter

export async function POST(req: Request) {
  try {
    const { message, model, messageHistory } = await req.json();
    
    // Log available context
    const hasContext = messageHistory && Array.isArray(messageHistory);
    console.log(`Processing request with ${hasContext ? messageHistory.length : 0} context messages`);

    // Clasificar el mensaje para detectar metas potenciales
    const classification = classifyAreaAndType(message);
    const { area, type, confidence, title } = classification;
    
    // Generar pasos del plan si la confianza es suficiente
    let planSteps: string[] = [];
    let timeframe = null;
    
    if (confidence > 0.6) {
      planSteps = await generatePlanSteps(message, area);
      timeframe = generateTimeframe(message, type);
    }

    // Generar respuesta conversacional
    const response = await generateConversationalResponse({
      message,
      area,
      type,
      confidence,
      planSteps,
      messageHistory
    });

    // Preparar metadatos para el frontend
    const metadata = {
      area,
      goalType: type,
      confidence,
      title: title || `Meta de ${area}`,
      steps: planSteps,
      timeframe
    };

    return NextResponse.json({ 
      response,
      metadata
    });

  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json(
      { error: 'Error processing your request' },
      { status: 500 }
    );
  }
} 