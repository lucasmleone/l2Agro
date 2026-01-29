/**
 * API: Registrar Lluvia
 * 
 * POST /api/telegram/lluvia
 * Body: { telegram_id, campo_id, fecha, mm }
 * Response: { success: true }
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id, campo_id, fecha, mm } = await request.json()

        if (!telegram_id || !campo_id || !fecha || mm === undefined) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
        }

        // Verificar que el telegram_id existe
        const { data: connection, error: connError } = await supabaseAdmin
            .from('telegram_connections')
            .select('user_id')
            .eq('telegram_id', telegram_id)
            .single()

        if (connError || !connection?.user_id) {
            return NextResponse.json({ error: 'Telegram no vinculado' }, { status: 401 })
        }

        // Verificar permiso del usuario
        const { data: permiso } = await supabaseAdmin
            .from('Campos_Usuarios')
            .select('id')
            .eq('user_id', connection.user_id)
            .eq('campo_id', campo_id)
            .single()

        if (!permiso) {
            return NextResponse.json({ error: 'No tienes acceso a este campo' }, { status: 403 })
        }

        // Insertar registro de lluvia
        // Nota: La tabla usa created_at como fecha y 'milimetros' como columna
        const { error: insertError } = await supabaseAdmin
            .from('Lluvias')
            .insert({
                campo_id,
                created_at: fecha,
                milimetros: parseFloat(mm)
            })

        if (insertError) {
            return NextResponse.json({ error: 'Error guardando registro: ' + insertError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

/**
 * DELETE /api/telegram/lluvia
 * Body: { telegram_id, lluvia_id }
 */
export async function DELETE(request: Request) {
    try {
        const { telegram_id, lluvia_id } = await request.json()

        if (!telegram_id || !lluvia_id) {
            return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
        }

        const { data: connection } = await supabaseAdmin
            .from('telegram_connections')
            .select('user_id')
            .eq('telegram_id', telegram_id)
            .single()

        if (!connection?.user_id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Obtener la lluvia para verificar permisos
        const { data: lluvia } = await supabaseAdmin
            .from('Lluvias')
            .select('id, campo_id')
            .eq('id', lluvia_id)
            .single()

        if (!lluvia) {
            return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
        }

        // Verificar que el usuario tiene acceso al campo
        const { data: permiso } = await supabaseAdmin
            .from('Campos_Usuarios')
            .select('id')
            .eq('user_id', connection.user_id)
            .eq('campo_id', lluvia.campo_id)
            .single()

        if (!permiso) {
            return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
        }

        // Eliminar
        const { error: deleteError } = await supabaseAdmin
            .from('Lluvias')
            .delete()
            .eq('id', lluvia_id)

        if (deleteError) {
            return NextResponse.json({ error: 'Error eliminando' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
