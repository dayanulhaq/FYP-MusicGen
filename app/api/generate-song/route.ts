import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI('AIzaSyBKnWKXWLhvuSRht6FSjjH04BNcSnGL6Oo');

export async function POST(request: Request) {
  try {
    const { theme } = await request.json();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Create a short song about "${theme}" with exactly this structure:
      Title (one line)
      Verse (4 lines maximum)
      Chorus (4 lines maximum)
      
      Rules:
      - Keep verses and chorus short (max 4 lines each)
      - Make it concise but meaningful
      - Theme: ${theme}
      - Total length should not exceed 9 lines (1 title + 4 verse + 4 chorus)`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json({ song: text });
  } catch (error) {
    console.error('Error generating song:', error);
    return NextResponse.json(
      { error: 'Failed to generate song' },
      { status: 500 }
    );
  }
} 