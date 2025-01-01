import MusicGeneration from '@/components/ui/MusicGeneration/MusicGeneration';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function MusicGenerationPage() {
  const supabase = createClient();

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return redirect('/signin');
  }

  return <MusicGeneration />;
} 