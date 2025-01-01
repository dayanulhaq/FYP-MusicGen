'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AiGeneratedSong() {
  const [generatedLyrics, setGeneratedLyrics] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState('');

  const generateSong = async () => {
    if (!theme.trim()) {
      setError('Please enter a theme or topic for your song');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: theme.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to generate song');
      }

      const data = await response.json();
      setGeneratedLyrics(data.song);
    } catch (error) {
      console.error('Error generating song:', error);
      setError('Failed to generate song. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AI Song Generator</h1>
        
        <div className="mb-6">
          <label htmlFor="theme" className="block text-sm font-medium mb-2">
            Enter a theme or topic for your song
          </label>
          <input
            id="theme"
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g., Love, Nature, Adventure, Dreams"
            className="w-full p-3 rounded-md bg-zinc-800 border border-zinc-700 
                     focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <button
          onClick={generateSong}
          disabled={isGenerating || !theme.trim()}
          className="bg-gradient-to-r from-purple-600 to-blue-600 
                   hover:from-purple-700 hover:to-blue-700
                   text-white font-bold py-3 px-6 rounded-lg
                   transition duration-300 ease-in-out
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Song'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-400">
            {error}
          </div>
        )}

        {generatedLyrics && (
          <div className="mt-8 p-6 bg-gray-900 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Generated Song:</h2>
            <pre className="whitespace-pre-wrap font-mono text-gray-300">
              {generatedLyrics}
            </pre>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-zinc-800">
          <div className="text-center">
            <p className="text-zinc-400 mb-4">Want to try something different?</p>
            <Link
              href="/music-generation"
              className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 
                       hover:from-indigo-700 hover:to-purple-700
                       text-white font-semibold py-3 px-8 rounded-lg
                       transition duration-300 ease-in-out"
            >
              Try Music Generator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}