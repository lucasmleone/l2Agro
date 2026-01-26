import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

function generarCodigo(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let codigo = ''
    for (let i = 0; i < 6; i++) {
        codigo += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return codigo
}

export async function POST(request: Request) {
    try {
        const { telegram_id, campo_id } = await request.json()

        if (!telegram_id || !campo_id) {
            return NextResponse.json({ error: 'telegram_id y campo_id requeridos' }, { status: 400 })
        }

        // 1. Verificar que el telegram_id existe y obtener user_id
        const { data: connection, error: connError } = await supabaseAdmin
            .from('telegram_connections')
            .select('user_id')
            .eq('telegram_id', telegram_id)
            .single()

        if (connError || !connection?.user_id) {
            return NextResponse.json({ error: 'Telegram no vinculado' }, { status: 401 })
        }

        // 2. Verificar que el usuario es admin de ese campo
        const { data: permisos, error: permError } = await supabaseAdmin
            .from('Campos_Usuarios')
            .select('id')
            .eq('user_id', connection.user_id)
            .eq('campo_id', campo_id)
            .eq('rol_id', 1)
            .single()

        if (permError || !permisos) {
            return NextResponse.json({ error: 'No tienes permiso para este campo' }, { status: 403 })
        }

        // 3. Generar código e insertar invitación
        const codigo = generarCodigo()

        const { error: insertError } = await supabaseAdmin
            .from('invitaciones')
            .insert({ codigo, campo_id })

        if (insertError) {
            return NextResponse.json({ error: 'Error generando código' }, { status: 500 })
        }

        return NextResponse.json({ codigo })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
