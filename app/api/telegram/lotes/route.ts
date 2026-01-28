import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id, campo_id } = await request.json()

        if (!telegram_id || !campo_id) {
            return NextResponse.json({ error: 'telegram_id y campo_id requeridos' }, { status: 400 })
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

        // 2. Verificar que el usuario tiene acceso al campo
        const { data: permiso } = await supabaseAdmin
            .from('Campos_Usuarios')
            .select('id')
            .eq('user_id', connection.user_id)
            .eq('campo_id', campo_id)
            .single()

        if (!permiso) {
            return NextResponse.json({ error: 'No tienes acceso a este campo' }, { status: 403 })
        }

        // 3. Obtener lotes del campo
        const { data: lotes, error } = await supabaseAdmin
            .from('Lotes')
            .select('id, name, ha')
            .eq('campo_id', campo_id)
            .order('name')

        if (error) {
            return NextResponse.json({ error: 'Error cargando lotes' }, { status: 500 })
        }

        return NextResponse.json({ lotes: lotes || [] })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
