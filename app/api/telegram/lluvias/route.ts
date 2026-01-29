/**
 * API: Listar Lluvias
 * 
 * GET /api/telegram/lluvias?telegram_id=xxx&campo_id=xxx
 * Response: { lluvias: [{ id, created_at, milimetros, campo_id }] }
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const telegram_id = searchParams.get('telegram_id')
        const campo_id = searchParams.get('campo_id')

        if (!telegram_id) {
            return NextResponse.json({ error: 'telegram_id requerido' }, { status: 400 })
        }

        const { data: connection } = await supabaseAdmin
            .from('telegram_connections')
            .select('user_id')
            .eq('telegram_id', telegram_id)
            .single()

        if (!connection?.user_id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Si hay campo_id, filtrar por ese campo
        if (campo_id) {
            const { data: permiso } = await supabaseAdmin
                .from('Campos_Usuarios')
                .select('id')
                .eq('user_id', connection.user_id)
                .eq('campo_id', campo_id)
                .single()

            if (!permiso) {
                return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
            }

            const { data: lluvias, error } = await supabaseAdmin
                .from('Lluvias')
                .select('id, created_at, milimetros, campo_id')
                .eq('campo_id', campo_id)
                .order('created_at', { ascending: false })
                .limit(20)

            if (error) {
                return NextResponse.json({ error: 'Error cargando lluvias' }, { status: 500 })
            }

            return NextResponse.json({ lluvias: lluvias || [] })
        }

        // Sin campo_id: obtener lluvias de todos los campos del usuario
        const { data: camposUsuario } = await supabaseAdmin
            .from('Campos_Usuarios')
            .select('campo_id')
            .eq('user_id', connection.user_id)

        const campoIds = camposUsuario?.map(c => c.campo_id) || []

        if (campoIds.length === 0) {
            return NextResponse.json({ lluvias: [] })
        }

        const { data: lluvias, error } = await supabaseAdmin
            .from('Lluvias')
            .select('id, created_at, milimetros, campo_id, Campos(name)')
            .in('campo_id', campoIds)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) {
            return NextResponse.json({ error: 'Error cargando lluvias' }, { status: 500 })
        }

        return NextResponse.json({ lluvias: lluvias || [] })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
