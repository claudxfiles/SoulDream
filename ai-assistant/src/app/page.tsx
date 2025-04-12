import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-6 py-8">
      <h1 className="text-center text-4xl font-extrabold tracking-tight lg:text-5xl">
        Welcome to AI Assistant
      </h1>
      <p className="text-center text-lg text-muted-foreground">
        Your personal AI assistant that helps you achieve your goals
      </p>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>
              Chat with your AI assistant and get personalized guidance
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p>
              Our AI assistant learns from your interactions to provide better recommendations
              and help you achieve your goals more effectively.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/ai-assistant" className="w-full">
              <Button className="w-full">Open AI Assistant</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Goal Setting</CardTitle>
            <CardDescription>
              Create and track your goals with AI assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p>
              Set meaningful goals, break them down into actionable tasks, and track your progress
              with the help of our AI assistant.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/ai-assistant" className="w-full">
              <Button className="w-full" variant="outline">Manage Goals</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Pattern Analysis</CardTitle>
            <CardDescription>
              Discover insights about your behavior and habits
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p>
              Our AI assistant analyzes your patterns and provides insights to help you optimize
              your workflow and improve your productivity.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/ai-assistant" className="w-full">
              <Button className="w-full" variant="outline">View Insights</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
