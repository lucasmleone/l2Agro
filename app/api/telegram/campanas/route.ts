import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id, lote_id } = await request.json()

        if (!telegram_id || !lote_id) {
            return NextResponse.json({ error: 'telegram_id y lote_id requeridos' }, { status: 400 })
        }

        // 1. Obtener user_id desde telegram_id
        const { data: connection, error: connError } = await supabaseAdmin
            .from('telegram_connections')
            .select('user_id')
            .eq('telegram_id', telegram_id)
            .single()

        if (connError || !connection?.user_id) {
            return NextResponse.json({ error: 'Telegram no vinculado' }, { status: 401 })
        }

        // 2. Verificar que el lote existe y obtener su campo
        const { data: lote, error: loteError } = await supabaseAdmin
            .from('Lotes')
            .select('id, campo_id')
            .eq('id', lote_id)
            .single()

        if (loteError || !lote) {
            return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
        }

        // 3. Verificar que el usuario tiene acceso al campo
        const { data: permiso } = await supabaseAdmin
            .from('Campos_Usuarios')
            .select('id')
            .eq('user_id', connection.user_id)
            .eq('campo_id', lote.campo_id)
            .single()

        if (!permiso) {
            return NextResponse.json({ error: 'No tienes acceso a este lote' }, { status: 403 })
        }

        // 4. Obtener campañas del lote, ordenadas por más reciente primero
        const { data: campanas, error } = await supabaseAdmin
            .from('Campañas')
            .select('id, name, created_at')
            .eq('lote_id', lote_id)
            .order('created_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: 'Error cargando campañas' }, { status: 500 })
        }

        return NextResponse.json({ campanas: campanas || [] })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
