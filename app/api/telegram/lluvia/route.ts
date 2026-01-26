import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id, campo_id, fecha, mm } = await request.json()

        if (!telegram_id || !campo_id || !fecha || mm === undefined) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
        }

        // 1. Verificar que el telegram_id existe
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

        // 3. Insertar registro de lluvia (usando el schema correcto)
        const { error: insertError } = await supabaseAdmin
            .from('Lluvias')
            .insert({
                campo_id,
                created_at: fecha,  // La tabla usa created_at como fecha
                milimetros: parseFloat(mm)  // La tabla usa 'milimetros' no 'mm'
            })

        if (insertError) {
            return NextResponse.json({ error: 'Error guardando registro: ' + insertError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
