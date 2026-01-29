/**
 * API: Registrar Cosecha
 * 
 * POST /api/telegram/cosecha
 * Body: { telegram_id, campana_id, humedad?, rendimiento, unidad_id }
 * Response: { success: true }
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id, campana_id, humedad, rendimiento, unidad_id } = await request.json()

        if (!telegram_id || !campana_id || rendimiento === undefined || !unidad_id) {
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

        // Verificar que la campaña existe y obtener su campo (vía lote)
        const { data: campana, error: campError } = await supabaseAdmin
            .from('Campañas')
            .select('id, lote_id, Lotes(campo_id)')
            .eq('id', campana_id)
            .single()

        if (campError || !campana) {
            return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
        }

        // Extraer campo_id del lote relacionado
        const campoId = (campana as any).Lotes?.campo_id
        if (!campoId) {
            return NextResponse.json({ error: 'Error obteniendo campo' }, { status: 500 })
        }

        // Verificar permiso del usuario
        const { data: permiso } = await supabaseAdmin
            .from('Campos_Usuarios')
            .select('id')
            .eq('user_id', connection.user_id)
            .eq('campo_id', campoId)
            .single()

        if (!permiso) {
            return NextResponse.json({ error: 'No tienes acceso a esta campaña' }, { status: 403 })
        }

        // Insertar cosecha
        const { error: insertError } = await supabaseAdmin
            .from('Cosechas')
            .insert({
                fecha: new Date().toISOString(),
                campaña_id: campana_id,
                unidad_id,
                rendimiento: parseFloat(rendimiento),
                humedad: humedad ? parseFloat(humedad) : null
            })

        if (insertError) {
            return NextResponse.json({ error: 'Error registrando cosecha: ' + insertError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
