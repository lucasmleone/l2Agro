import { createClient } from '@supabase/supabase-js'

// Cliente para uso en el SERVIDOR (con service role - acceso total)
// NUNCA usar en el frontend
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,  // Usamos la misma URL pública
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // Solo esta es nueva
)
