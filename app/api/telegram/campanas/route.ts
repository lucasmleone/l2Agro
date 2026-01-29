/**
 * API: Obtener Campañas de un Lote
 * 
 * POST /api/telegram/campanas
 * Body: { telegram_id, lote_id }
 * Response: { campanas: [{ id, name, created_at }] }
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id, lote_id } = await request.json()

        if (!telegram_id || !lote_id) {
            return NextResponse.json({ error: 'telegram_id y lote_id requeridos' }, { status: 400 })
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

        // Verificar permiso del usuario
        const { data: permiso } = await supabaseAdmin
            .from('Campos_Usuarios')
            .select('id')
            .eq('user_id', connection.user_id)
            .eq('campo_id', lote.campo_id)
            .single()

        if (!permiso) {
            return NextResponse.json({ error: 'No tienes acceso a este lote' }, { status: 403 })
        }

        // Obtener campañas del lote
        const { data: campanas, error } = await supabaseAdmin
            .from('Campañas')
            .select('id, name, created_at')
            .eq('lote_id', lote_id)

        if (error) {
            return NextResponse.json({ error: 'Error cargando campañas' }, { status: 500 })
        }

        // Ordenar por período extraído del nombre (ej: "Soja 24/25" -> "24/25")
        // Períodos más recientes primero (26/27 antes que 24/25)
        const sortedCampanas = (campanas || []).sort((a, b) => {
            const periodA = a.name?.match(/(\d{2}\/\d{2})$/)?.[1] || '00/00'
            const periodB = b.name?.match(/(\d{2}\/\d{2})$/)?.[1] || '00/00'
            return periodB.localeCompare(periodA)
        })

        return NextResponse.json({ campanas: sortedCampanas })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
