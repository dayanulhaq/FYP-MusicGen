'use client';

import { PropsWithChildren } from 'react';
import Navbar from '@/components/ui/Navbar';
import { Toaster } from '@/components/ui/Toasts/toaster';

export default function RootLayoutClient({ children }: PropsWithChildren) {
  return (
    <>
      <Navbar />
      <main
        id="skip"
        className="min-h-[calc(100dvh-4rem)] md:min-h[calc(100dvh-5rem)]"
      >
        {children}
      </main>
      <Toaster />
    </>
  );
} 