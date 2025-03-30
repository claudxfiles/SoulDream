import { NextResponse } from 'next/server';

export async function GET() {
  // Redirect to the subscription page with a cancelled parameter
  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: '/subscription?cancelled=true'
    }
  });
} 