import { supabase } from '@/integrations/supabase/client';

export async function parseResume(fileUrl: string, candidateId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('parse-resume', {
      body: { fileUrl, candidateId },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw error;
  }
}
