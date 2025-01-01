'use client';

import Link from 'next/link';

export default function AiSongButton() {
  return (
    <div className="mt-6 mb-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-black text-zinc-400">
            Try our AI Song Generator
          </span>
        </div>
      </div>

      <Link 
        href="/ai-song-generator"
        className="mt-4 w-full flex items-center justify-center px-4 py-2
                 bg-gradient-to-r from-purple-600 to-blue-600 
                 hover:from-purple-700 hover:to-blue-700
                 text-white rounded-md transition duration-300 ease-in-out"
      >
        Launch AI Song Generator
      </Link>
    </div>
  );
} 