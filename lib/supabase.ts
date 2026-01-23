import { createClient } from '@supabase/supabase-js'

// Next.js lee automáticamente las variables que empiezan con NEXT_PUBLIC_
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan las variables de entorno de Supabase en .env.local')
}

// Exportamos una única instancia del cliente para usar en toda la app
export const supabase = createClient(supabaseUrl, supabaseAnonKey)