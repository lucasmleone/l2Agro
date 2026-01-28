import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id } = await request.json()

        if (!telegram_id) {
            return NextResponse.json({ error: 'telegram_id requerido' }, { status: 400 })
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

        // 2. Obtener cultivos (sin filtrar por user, ya que pueden ser compartidos)
        const { data: cultivos, error } = await supabaseAdmin
            .from('Cultivos')
            .select('id, name')
            .order('name')

        if (error) {
            return NextResponse.json({ error: 'Error cargando cultivos' }, { status: 500 })
        }

        return NextResponse.json({ cultivos: cultivos || [] })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
