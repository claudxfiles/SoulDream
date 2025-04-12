import { AiChatInterface } from '@/components/ai-assistant/AiChatInterface';

export default function AIAssistantPage() {
  return (
    <div className="container mx-auto h-[calc(100vh-4rem)] py-6">
      <h1 className="mb-4 text-2xl font-bold">AI Assistant</h1>
      <p className="mb-6 text-muted-foreground">
        Your personal AI assistant that learns from your interactions and helps you achieve your goals.
      </p>

      <div className="h-[calc(100vh-12rem)]">
        <AiChatInterface />
      </div>
    </div>
  );
}
