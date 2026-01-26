import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id, codigo } = await request.json()

        if (!telegram_id || !codigo) {
            return NextResponse.json({ error: 'telegram_id y codigo requeridos' }, { status: 400 })
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

        // 2. Buscar la invitación
        const { data: invitacion, error: invError } = await supabaseAdmin
            .from('invitaciones')
            .select('id, campo_id')
            .eq('codigo', codigo.toUpperCase())
            .single()

        if (invError || !invitacion) {
            return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 404 })
        }

        // 3. Verificar que el usuario no esté ya en ese campo
        const { data: existing } = await supabaseAdmin
            .from('Campos_Usuarios')
            .select('id')
            .eq('user_id', connection.user_id)
            .eq('campo_id', invitacion.campo_id)
            .single()

        if (existing) {
            // Ya está en el campo, borrar invitación y retornar OK
            await supabaseAdmin.from('invitaciones').delete().eq('id', invitacion.id)
            return NextResponse.json({ success: true, message: 'Ya estás en este campo' })
        }

        // 4. Agregar usuario al campo como user (rol_id = 2)
        const { error: linkError } = await supabaseAdmin
            .from('Campos_Usuarios')
            .insert({
                user_id: connection.user_id,
                campo_id: invitacion.campo_id,
                rol_id: 2 // user, no admin
            })

        if (linkError) {
            return NextResponse.json({ error: 'Error uniéndose al campo' }, { status: 500 })
        }

        // 5. Borrar la invitación (un solo uso)
        await supabaseAdmin.from('invitaciones').delete().eq('id', invitacion.id)

        return NextResponse.json({ success: true })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
