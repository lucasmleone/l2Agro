/**
 * API: Crear Campaña
 * 
 * POST /api/telegram/campana
 * Body: { telegram_id, lote_id, name }
 * Response: { success: true }
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id, lote_id, name } = await request.json()

        if (!telegram_id || !lote_id || !name) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
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

        // Verificar que el lote existe y obtener su campo
        const { data: lote, error: loteError } = await supabaseAdmin
            .from('Lotes')
            .select('id, campo_id')
            .eq('id', lote_id)
            .single()

        if (loteError || !lote) {
            return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
        }

        // Verificar que el usuario tiene acceso al campo
        const { data: permiso } = await supabaseAdmin
            .from('Campos_Usuarios')
            .select('id')
            .eq('user_id', connection.user_id)
            .eq('campo_id', lote.campo_id)
            .single()

        if (!permiso) {
            return NextResponse.json({ error: 'No tienes acceso a este lote' }, { status: 403 })
        }

        // Insertar campaña
        const { error: insertError } = await supabaseAdmin
            .from('Campañas')
            .insert({ lote_id, name })

        if (insertError) {
            return NextResponse.json({ error: 'Error creando campaña: ' + insertError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
