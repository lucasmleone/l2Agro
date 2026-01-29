/**
 * API: Crear Campo
 * 
 * Endpoint: POST /api/telegram/campos/crear
 * 
 * Crea un nuevo campo y asigna al usuario como administrador.
 * 
 * Body: { telegram_id, name }
 * Response: { success: true, campo_id } o { error: string }
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id, name } = await request.json()

        if (!telegram_id || !name) {
            return NextResponse.json({ error: 'telegram_id y name requeridos' }, { status: 400 })
        }

        // Obtener user_id desde telegram_id
        const { data: connection, error: connError } = await supabaseAdmin
            .from('telegram_connections')
            .select('user_id')
            .eq('telegram_id', telegram_id)
            .single()

        if (connError || !connection?.user_id) {
            return NextResponse.json({ error: 'Telegram no vinculado' }, { status: 401 })
        }

        // Crear el campo
        const { data: campo, error: campoError } = await supabaseAdmin
            .from('Campos')
            .insert({ name })
            .select('id')
            .single()

        if (campoError || !campo) {
            return NextResponse.json({ error: 'Error creando campo' }, { status: 500 })
        }

        // Asociar usuario al campo
        const { error: linkError } = await supabaseAdmin
            .from('Campos_Usuarios')
            .insert({
                user_id: connection.user_id,
                campo_id: campo.id,
                rol_id: 1
            })

        if (linkError) {
            return NextResponse.json({ error: 'Error asociando usuario al campo' }, { status: 500 })
        }

        return NextResponse.json({ success: true, campo_id: campo.id })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
