/**
 * API: Unirse a Campo con Código
 * 
 * POST /api/telegram/campos/unirse
 * Body: { telegram_id, codigo }
 * Response: { success: true }
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id, codigo } = await request.json()

        if (!telegram_id || !codigo) {
            return NextResponse.json({ error: 'telegram_id y codigo requeridos' }, { status: 400 })
        }

        const { data: connection, error: connError } = await supabaseAdmin
            .from('telegram_connections')
            .select('user_id')
            .eq('telegram_id', telegram_id)
            .single()

        if (connError || !connection?.user_id) {
            return NextResponse.json({ error: 'Telegram no vinculado' }, { status: 401 })
        }

        const { data: invitacion, error: invError } = await supabaseAdmin
            .from('invitaciones')
            .select('id, campo_id')
            .eq('codigo', codigo.toUpperCase())
            .single()

        if (invError || !invitacion) {
            return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 404 })
        }

        const { data: existing } = await supabaseAdmin
            .from('Campos_Usuarios')
            .select('id')
            .eq('user_id', connection.user_id)
            .eq('campo_id', invitacion.campo_id)
            .single()

        if (existing) {
            await supabaseAdmin.from('invitaciones').delete().eq('id', invitacion.id)
            return NextResponse.json({ success: true, message: 'Ya estás en este campo' })
        }

        const { error: linkError } = await supabaseAdmin
            .from('Campos_Usuarios')
            .insert({
                user_id: connection.user_id,
                campo_id: invitacion.campo_id,
                rol_id: 2
            })

        if (linkError) {
            return NextResponse.json({ error: 'Error uniéndose al campo' }, { status: 500 })
        }

        await supabaseAdmin.from('invitaciones').delete().eq('id', invitacion.id)

        return NextResponse.json({ success: true })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
