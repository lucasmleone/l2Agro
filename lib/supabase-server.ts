import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Cliente para uso en el SERVIDOR (con service role - acceso total)
// NUNCA usar en el frontend

let supabaseAdmin: SupabaseClient

// Solo crear el cliente si las variables existen (evita error en build)
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )
} else {
    // Durante el build, crear un cliente dummy que será reemplazado en runtime
    supabaseAdmin = null as any
}

export { supabaseAdmin }
