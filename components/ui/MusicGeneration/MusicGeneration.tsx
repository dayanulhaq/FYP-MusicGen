'use client';

import { useState, useRef } from 'react';

export default function MusicGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genre, setGenre] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [generatedMusic, setGeneratedMusic] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioData(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const generateMusic = async () => {
    if (!genre.trim() || !audioData) {
      setError('Please record your voice and enter a genre');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          genre: genre.trim(),
          audioData: audioData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate music');
      }

      const data = await response.json();
      setGeneratedMusic(data.musicUrl);
    } catch (error) {
      console.error('Error generating music:', error);
      setError('Failed to generate music. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Voice + AI Music Generator</h1>
        
        <div className="mb-6">
          <label htmlFor="genre" className="block text-sm font-medium mb-2">
            Enter a music style for the background
          </label>
          <input
            id="genre"
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="e.g., Rock, Jazz, Classical, Pop"
            className="w-full p-3 rounded-md bg-zinc-800 border border-zinc-700 
                     focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="mb-6">
          <p className="text-sm text-zinc-400 mb-4">
            First, record your voice. Then we'll add AI-generated background music.
          </p>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white font-bold py-3 px-6 rounded-lg
            transition duration-300 ease-in-out mr-4`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>

          {audioURL && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Your Voice Recording:</p>
              <audio controls src={audioURL} className="w-full" />
            </div>
          )}
        </div>

        <button
          onClick={generateMusic}
          disabled={isGenerating || !genre.trim() || !audioData}
          className="bg-gradient-to-r from-purple-600 to-blue-600 
                   hover:from-purple-700 hover:to-blue-700
                   text-white font-bold py-3 px-6 rounded-lg
                   transition duration-300 ease-in-out
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Adding Background Music...' : 'Add Background Music'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-400">
            {error}
          </div>
        )}

        {generatedMusic && (
          <div className="mt-8 p-6 bg-gray-900 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Final Mix:</h2>
            <audio controls src={generatedMusic} className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
} 