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
            return NextResponse.json({ error: 'Telegram no vinculado', redirect: '/telegram/auth' }, { status: 401 })
        }

        // 2. Obtener campos donde el usuario es admin (rol_id = 1)
        const { data: camposData, error } = await supabaseAdmin
            .from('Campos_Usuarios')
            .select('campo_id, Campos(id, name)')
            .eq('user_id', connection.user_id)
            .eq('rol_id', 1)

        if (error) {
            return NextResponse.json({ error: 'Error cargando campos' }, { status: 500 })
        }

        const campos = camposData?.map((cu: any) => ({
            id: cu.Campos.id,
            name: cu.Campos.name
        })) || []

        return NextResponse.json({ campos })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
