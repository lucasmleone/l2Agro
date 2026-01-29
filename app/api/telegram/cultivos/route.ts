/**
 * API: Obtener Cultivos
 * 
 * Endpoint: POST /api/telegram/cultivos
 * 
 * Retorna todos los cultivos disponibles (compartidos entre usuarios).
 * 
 * Body: { telegram_id }
 * Response: { cultivos: [{ id, name }] }
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id } = await request.json()

        if (!telegram_id) {
            return NextResponse.json({ error: 'telegram_id requerido' }, { status: 400 })
        }

        // Verificar que el telegram está vinculado
        const { data: connection, error: connError } = await supabaseAdmin
            .from('telegram_connections')
            .select('user_id')
            .eq('telegram_id', telegram_id)
            .single()

        if (connError || !connection?.user_id) {
            return NextResponse.json({ error: 'Telegram no vinculado' }, { status: 401 })
        }

        // Obtener todos los cultivos (son compartidos, no se filtran por usuario)
        const { data: cultivos, error } = await supabaseAdmin
            .from('Cultivos')
            .select('id, name')
            .order('name')

        if (error) {
            return NextResponse.json({ error: 'Error cargando cultivos' }, { status: 500 })
        }

        return NextResponse.json({ cultivos: cultivos || [] })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
