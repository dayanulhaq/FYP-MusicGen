'use client';

import { useState, useRef } from 'react';

const MUSIC_STYLES = [
  "Rock", "Pop", "Classical", "Jazz", "Blues", "Hip-Hop/Rap", "Electronic/Dance",
  "Country", "R&B/Soul", "Reggae", "Folk", "Metal", "Punk", "Alternative",
  "Indie", "Latin", "Gospel", "Opera", "K-Pop", "J-Pop", "Disco", "House",
  "Trance", "Techno", "Dubstep", "Ambient", "New Age", "Ska", "Grunge",
  "Synthwave", "World Music", "Afrobeat", "Dancehall", "Trap", "Lo-fi",
  "Industrial", "Progressive Rock", "Baroque", "Chillout", "Experimental",
  "Acoustic", "Post-Rock", "Shoegaze", "Hardcore", "Soundtrack",
  "Musical Theater", "Swing", "Bossa Nova", "Samba", "Tango", "Flamenco",
  "Celtic", "Medieval", "Gregorian Chant", "Klezmer", "Bluegrass", "Zydeco",
  "Chiptune/8-bit", "Soca", "Highlife", "Mariachi", "Polka", "Ethnic Fusion",
  "Drum and Bass", "Breakbeat", "Electro Swing", "Garage Rock", "Dream Pop",
  "Art Rock", "Math Rock", "Psychedelic Rock", "Gothic Rock", "Doom Metal",
  "Black Metal", "Thrash Metal", "Symphonic Metal", "Vaporwave", "Future Bass",
  "Electropop", "Post-Punk", "Noise Music", "Hyperpop", "Reggaeton",
  "Dance-Pop", "Minimalism", "Choral", "Sufi Music", "Indian Classical",
  "Carnatic", "Bollywood", "Qawwali", "Mandopop", "Cantopop", "Jungle",
  "Hardstyle", "Gabber", "Future Garage", "Liquid Funk", "Skiffle",
  "Avant-Garde"
];

export default function MusicGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genre, setGenre] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<Blob | null>(null);
  const [generatedMusic, setGeneratedMusic] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mixedAudioUrl, setMixedAudioUrl] = useState<string | null>(null);
  const recordingStartTime = useRef<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const voiceSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [combinedAudioBlob, setCombinedAudioBlob] = useState<Blob | null>(null);
  const [isGenreListOpen, setIsGenreListOpen] = useState(false);
  const [filteredStyles, setFilteredStyles] = useState(MUSIC_STYLES);

  const handleGenreSearch = (searchTerm: string) => {
    setGenre(searchTerm);
    const filtered = MUSIC_STYLES.filter(style => 
      style.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStyles(filtered);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTime.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const duration = (Date.now() - recordingStartTime.current) / 1000;
        setRecordingDuration(duration);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        setAudioData(audioBlob);
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

  const playMixedAudio = async () => {
    if (!audioData || !generatedMusic) return;

    try {
      // Stop any currently playing audio
      if (voiceSourceRef.current || musicSourceRef.current) {
        voiceSourceRef.current?.stop();
        musicSourceRef.current?.stop();
        setIsPlaying(false);
        return;
      }

      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;

      // Load voice recording
      const voiceArrayBuffer = await audioData.arrayBuffer();
      const voiceBuffer = await audioContext.decodeAudioData(voiceArrayBuffer);

      // Load background music
      const musicResponse = await fetch(generatedMusic);
      const musicArrayBuffer = await musicResponse.arrayBuffer();
      const musicBuffer = await audioContext.decodeAudioData(musicArrayBuffer);

      // Create an offline context for mixing
      const offlineContext = new OfflineAudioContext(
        2, // stereo
        audioContext.sampleRate * Math.max(voiceBuffer.duration, musicBuffer.duration),
        audioContext.sampleRate
      );

      // Create sources and gain nodes in offline context
      const voiceSource = offlineContext.createBufferSource();
      const musicSource = offlineContext.createBufferSource();
      const voiceGain = offlineContext.createGain();
      const musicGain = offlineContext.createGain();

      // Set buffers
      voiceSource.buffer = voiceBuffer;
      musicSource.buffer = musicBuffer;

      // Set volumes
      voiceGain.gain.value = 1.0;
      musicGain.gain.value = 0.3;

      // Connect nodes
      voiceSource.connect(voiceGain).connect(offlineContext.destination);
      musicSource.connect(musicGain).connect(offlineContext.destination);

      // Start both sources
      voiceSource.start(0);
      musicSource.start(0);

      // Render the mixed audio
      const renderedBuffer = await offlineContext.startRendering();

      // Convert the rendered buffer to an MP4 blob
      const mixedAudioBlob = await new Promise<Blob>((resolve) => {
        const chunks: Blob[] = [];
        const mediaRecorder = new MediaRecorder(
          audioContext.createMediaStreamDestination().stream,
          {
            mimeType: 'audio/mp4' // Set MIME type to MP4
          }
        );
        
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => resolve(new Blob(chunks, { type: 'audio/mp4' }));

        const source = audioContext.createBufferSource();
        source.buffer = renderedBuffer;
        source.connect(audioContext.destination);
        source.start();
        mediaRecorder.start();

        setTimeout(() => mediaRecorder.stop(), renderedBuffer.duration * 1000);
      });

      // Create URL for the mixed audio
      const mixedUrl = URL.createObjectURL(mixedAudioBlob);
      setMixedAudioUrl(mixedUrl);

      // Play the mixed audio
      const audioElement = new Audio(mixedUrl);
      audioElement.play();
      setIsPlaying(true);

      audioElement.onended = () => {
        setIsPlaying(false);
      };
    } catch (error) {
      console.error('Error playing mixed audio:', error);
      setError('Failed to play mixed audio');
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
          duration: Math.ceil(recordingDuration) // Send recorded duration
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to generate music');
      }

      setGeneratedMusic(data.musicUrl);
    } catch (error) {
      console.error('Error generating music:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to generate music. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const combineAndDownloadAudio = async () => {
    if (!audioData || !generatedMusic) return;

    try {
      setIsGenerating(true);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Load voice recording
      const voiceArrayBuffer = await audioData.arrayBuffer();
      const voiceBuffer = await audioContext.decodeAudioData(voiceArrayBuffer);

      // Load background music
      const musicResponse = await fetch(generatedMusic);
      const musicArrayBuffer = await musicResponse.arrayBuffer();
      const musicBuffer = await audioContext.decodeAudioData(musicArrayBuffer);

      // Get the longest duration and use original sample rate
      const duration = Math.max(voiceBuffer.duration, musicBuffer.duration);
      const sampleRate = voiceBuffer.sampleRate; // Use original sample rate

      // Create an offline context matching the original sample rate
      const offlineContext = new OfflineAudioContext(
        2, // stereo
        Math.ceil(sampleRate * duration),
        sampleRate
      );

      // Create sources and gain nodes
      const voiceSource = offlineContext.createBufferSource();
      const musicSource = offlineContext.createBufferSource();
      const voiceGain = offlineContext.createGain();
      const musicGain = offlineContext.createGain();

      // Ensure playback rate is 1
      voiceSource.playbackRate.value = 1;
      musicSource.playbackRate.value = 1;

      // Set buffers
      voiceSource.buffer = voiceBuffer;
      musicSource.buffer = musicBuffer;

      // Set volumes
      voiceGain.gain.value = 1.0;
      musicGain.gain.value = 0.3;

      // Connect nodes
      voiceSource.connect(voiceGain).connect(offlineContext.destination);
      musicSource.connect(musicGain).connect(offlineContext.destination);

      // Start both sources at time 0
      voiceSource.start(0);
      musicSource.start(0);

      // Render the mixed audio
      const renderedBuffer = await offlineContext.startRendering();

      // Convert to WAV maintaining original timing
      const wavBlob = await audioBufferToWav(renderedBuffer, sampleRate);
      setCombinedAudioBlob(wavBlob);

      // Create URL and trigger download
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'combined-audio.wav';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error combining audio:', error);
      setError('Failed to combine audio');
    } finally {
      setIsGenerating(false);
    }
  };

  // Updated audioBufferToWav function with proper timing
  const audioBufferToWav = (buffer: AudioBuffer, sampleRate: number): Promise<Blob> => {
    const numChannels = buffer.numberOfChannels;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    // Calculate data length based on original duration
    const dataLength = Math.ceil(buffer.length * blockAlign);
    const bufferLength = 44 + dataLength;
    
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    
    // WAV header with original sample rate
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true); // Original sample rate
    view.setUint32(28, sampleRate * blockAlign, true); // Byte rate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write audio data preserving original timing
    const offset = 44;
    let index = 0;
    
    // Interleave channels properly
    const length = buffer.length;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset + index, value, true);
        index += bytesPerSample;
      }
    }
    
    return Promise.resolve(new Blob([arrayBuffer], { 
      type: 'audio/wav' 
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Voice + AI Music Generator</h1>
        
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

        <div className="mb-6 relative">
          <label htmlFor="genre" className="block text-sm font-medium mb-2">
            Enter or select a music style for the background
          </label>
          <div className="relative">
            <input
              id="genre"
              type="text"
              value={genre}
              onChange={(e) => handleGenreSearch(e.target.value)}
              onFocus={() => setIsGenreListOpen(true)}
              placeholder="Type or select a music style"
              className="w-full p-3 rounded-md bg-zinc-800 border border-zinc-700 
                       focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => setIsGenreListOpen(!isGenreListOpen)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <svg
                className={`w-5 h-5 transition-transform ${isGenreListOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Dropdown list */}
          {isGenreListOpen && (
            <div 
              className="absolute z-10 w-full mt-1 max-h-60 overflow-auto
                         bg-zinc-800 border border-zinc-700 rounded-md shadow-lg"
            >
              {filteredStyles.map((style, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setGenre(style);
                    setIsGenreListOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-zinc-700
                           transition-colors duration-150 ease-in-out"
                >
                  {style}
                </button>
              ))}
              {filteredStyles.length === 0 && (
                <div className="px-4 py-2 text-zinc-400">
                  No matching styles found
                </div>
              )}
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
          {isGenerating ? 'Generating Background Music...' : 'Generate Background Music'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-400">
            {error}
          </div>
        )}

        {generatedMusic && audioData && (
          <div className="mt-8 p-6 bg-gray-900 rounded-lg">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Background Music:</h2>
              <audio controls src={generatedMusic} className="w-full mb-4" />
            </div>
            
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Combined Audio:</h2>
              <div className="space-y-4">
                <button
                  onClick={playMixedAudio}
                  className={`w-full ${
                    isPlaying 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white font-bold py-3 px-6 rounded-lg
                  transition duration-300 ease-in-out`}
                >
                  {isPlaying ? 'Stop Playing' : 'Play Combined Audio'}
                </button>

                <button
                  onClick={combineAndDownloadAudio}
                  disabled={isGenerating}
                  className="w-full bg-green-600 hover:bg-green-700
                           text-white font-bold py-3 px-6 rounded-lg
                           transition duration-300 ease-in-out
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Processing...' : 'Download Combined Audio (WAV)'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 