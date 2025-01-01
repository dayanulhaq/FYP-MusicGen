import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || 'r8_QFyvHcZtHQV8a1XURelEqUTlWXu5B7N3FL15e'
});

export async function POST(request: Request) {
  try {
    const { genre, duration } = await request.json();

    // Generate background music with matching duration
    const prediction = await replicate.predictions.create({
      version: "7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573787906",
      input: {
        model_version: "melody",
        prompt: `Generate ${genre} style background music`,
        duration: duration || 30 // Use recorded duration or default to 30 seconds
      }
    });

    // Wait for the generation to complete
    let musicUrl = null;
    while (!musicUrl) {
      const result = await replicate.predictions.get(prediction.id);
      if (result.status === 'succeeded') {
        musicUrl = result.output;
        break;
      } else if (result.status === 'failed') {
        throw new Error('Music generation failed');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      musicUrl,
      success: true
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate music',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}