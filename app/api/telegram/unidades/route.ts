/**
 * API: Obtener Unidades
 * 
 * Endpoint: POST /api/telegram/unidades
 * 
 * Retorna unidades de medida, opcionalmente filtradas por tipo.
 * Tipos: 1=Siembra, 2=Fertilizante, 3=Agroquímicos, 4=Cosecha, etc.
 * 
 * Body: { telegram_id, tipo_unidad_id? }
 * Response: { unidades: [{ id, name }] }
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id, tipo_unidad_id } = await request.json()

        if (!telegram_id) {
            return NextResponse.json({ error: 'telegram_id requerido' }, { status: 400 })
        }

        // Verificar telegram vinculado
        const { data: connection, error: connError } = await supabaseAdmin
            .from('telegram_connections')
            .select('user_id')
            .eq('telegram_id', telegram_id)
            .single()

        if (connError || !connection?.user_id) {
            return NextResponse.json({ error: 'Telegram no vinculado' }, { status: 401 })
        }

        // Construir query base
        let query = supabaseAdmin
            .from('Unidades')
            .select('id, name')
            .order('id')

        // Filtrar por tipo si se especifica
        if (tipo_unidad_id) {
            query = query.eq('tipo_unidad_id', tipo_unidad_id)
        }

        const { data: unidades, error } = await query

        if (error) {
            return NextResponse.json({ error: 'Error cargando unidades' }, { status: 500 })
        }

        return NextResponse.json({ unidades: unidades || [] })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
