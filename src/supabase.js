import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yjqnzlxvfpxffainpqef.supabase.co'
const supabaseKey = 'sb_publishable_IrPWWwfJ2DTaEsXVBD6Z3A_99ijynGD'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})