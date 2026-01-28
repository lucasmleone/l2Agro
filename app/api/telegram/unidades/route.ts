import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id } = await request.json()

        if (!telegram_id) {
            return NextResponse.json({ error: 'telegram_id requerido' }, { status: 400 })
        }

        // 1. Verificar que el telegram está vinculado
        const { data: connection, error: connError } = await supabaseAdmin
            .from('telegram_connections')
            .select('user_id')
            .eq('telegram_id', telegram_id)
            .single()

        if (connError || !connection?.user_id) {
            return NextResponse.json({ error: 'Telegram no vinculado' }, { status: 401 })
        }

        // 2. Obtener todas las unidades
        const { data: unidades, error } = await supabaseAdmin
            .from('Unidades')
            .select('id, name')
            .order('id')

        if (error) {
            return NextResponse.json({ error: 'Error cargando unidades' }, { status: 500 })
        }

        return NextResponse.json({ unidades: unidades || [] })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
