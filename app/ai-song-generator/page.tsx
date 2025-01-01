import AiGeneratedSong from '@/components/ui/AiGeneratedSong/AiGeneratedSong';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function AiSongGeneratorPage() {
  const supabase = createClient();

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return redirect('/signin');
  }

  return <AiGeneratedSong />;
} 