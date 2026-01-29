/**
 * API: Obtener Campos del Usuario
 * 
 * POST /api/telegram/campos
 * Body: { telegram_id }
 * Response: { campos: [{ id, name, isAdmin }] }
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id } = await request.json()

        if (!telegram_id) {
            return NextResponse.json({ error: 'telegram_id requerido' }, { status: 400 })
        }

        const { data: connection, error: connError } = await supabaseAdmin
            .from('telegram_connections')
            .select('user_id')
            .eq('telegram_id', telegram_id)
            .single()

        if (connError || !connection?.user_id) {
            return NextResponse.json({ error: 'Telegram no vinculado', redirect: '/telegram/auth' }, { status: 401 })
        }

        const { data: camposData, error } = await supabaseAdmin
            .from('Campos_Usuarios')
            .select('campo_id, rol_id, Campos(id, name)')
            .eq('user_id', connection.user_id)

        if (error) {
            return NextResponse.json({ error: 'Error cargando campos' }, { status: 500 })
        }

        const campos = camposData?.map((cu: any) => ({
            id: cu.Campos.id,
            name: cu.Campos.name,
            isAdmin: cu.rol_id === 1
        })) || []

        return NextResponse.json({ campos })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
