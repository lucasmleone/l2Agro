/**
 * API: Autenticación de Telegram
 * 
 * Endpoint: POST /api/telegram/auth
 * 
 * Maneja login y registro de usuarios vinculando su cuenta de Telegram.
 * 
 * Body: { telegram_id, email, password, action: 'LOGIN' | 'REGISTER' }
 * Response: { success: true, user_id } o { error: string }
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id, email, password, action } = await request.json()

        // Validar datos requeridos
        if (!telegram_id || !email || !password) {
            return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
        }

        if (action !== 'LOGIN' && action !== 'REGISTER') {
            return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
        }

        let userUuid: string | null = null

        if (action === 'LOGIN') {
            // Verificar credenciales con Supabase Auth
            const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })
            if (error) {
                return NextResponse.json({ error: error.message }, { status: 401 })
            }
            userUuid = data.user.id
        } else {
            // Registrar nuevo usuario en Supabase Auth
            const { data, error } = await supabaseAdmin.auth.signUp({ email, password })
            if (error) {
                return NextResponse.json({ error: error.message }, { status: 400 })
            }
            if (!data.user) {
                return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
            }
            userUuid = data.user.id
            // Nota: Un trigger de Supabase crea el perfil en public.Users automáticamente
        }

        // Vincular Telegram ID con el usuario (upsert para evitar duplicados)
        const { error: linkError } = await supabaseAdmin
            .from('telegram_connections')
            .upsert({ telegram_id, user_id: userUuid }, { onConflict: 'telegram_id' })

        if (linkError) {
            return NextResponse.json({ error: 'Error vinculando Telegram: ' + linkError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, user_id: userUuid })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
