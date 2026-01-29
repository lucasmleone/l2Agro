/**
 * API: Listar Cosechas
 * 
 * GET /api/telegram/cosechas?telegram_id=xxx&campana_id=xxx
 * Response: { cosechas: [{ id, created_at, rendimiento, humedad, unidad_id, campana_id }] }
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const telegram_id = searchParams.get('telegram_id')
        const campana_id = searchParams.get('campana_id')

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

        // Si hay campana_id, filtrar por esa campaña
        if (campana_id) {
            // Verificar que la campaña existe y obtener su lote/campo
            const { data: campana } = await supabaseAdmin
                .from('Campañas')
                .select('id, name, lote_id, Lotes(campo_id)')
                .eq('id', campana_id)
                .single()

            if (!campana) {
                return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
            }

            // Verificar permiso
            const { data: permiso } = await supabaseAdmin
                .from('Campos_Usuarios')
                .select('id')
                .eq('user_id', connection.user_id)
                .eq('campo_id', (campana.Lotes as any).campo_id)
                .single()

            if (!permiso) {
                return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
            }

            const { data: cosechas, error } = await supabaseAdmin
                .from('Cosechas')
                .select('id, created_at, rendimiento, humedad, unidad_id, campana_id, Unidades(name)')
                .eq('campana_id', campana_id)
                .order('created_at', { ascending: false })
                .limit(20)

            if (error) {
                return NextResponse.json({ error: 'Error cargando cosechas' }, { status: 500 })
            }

            return NextResponse.json({
                cosechas: cosechas || [],
                campana: { id: campana.id, name: campana.name }
            })
        }

        // Sin campana_id: obtener cosechas recientes de todas las campañas del usuario
        const { data: camposUsuario } = await supabaseAdmin
            .from('Campos_Usuarios')
            .select('campo_id')
            .eq('user_id', connection.user_id)

        const campoIds = camposUsuario?.map(c => c.campo_id) || []

        if (campoIds.length === 0) {
            return NextResponse.json({ cosechas: [] })
        }

        // Obtener lotes de esos campos
        const { data: lotes } = await supabaseAdmin
            .from('Lotes')
            .select('id')
            .in('campo_id', campoIds)

        const loteIds = lotes?.map(l => l.id) || []

        if (loteIds.length === 0) {
            return NextResponse.json({ cosechas: [] })
        }

        // Obtener campañas de esos lotes
        const { data: campanas } = await supabaseAdmin
            .from('Campañas')
            .select('id')
            .in('lote_id', loteIds)

        const campanaIds = campanas?.map(c => c.id) || []

        if (campanaIds.length === 0) {
            return NextResponse.json({ cosechas: [] })
        }

        const { data: cosechas, error } = await supabaseAdmin
            .from('Cosechas')
            .select(`
                id, created_at, rendimiento, humedad, unidad_id, campana_id,
                Unidades(name),
                Campañas(name, Lotes(name, Campos(name)))
            `)
            .in('campana_id', campanaIds)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) {
            return NextResponse.json({ error: 'Error cargando cosechas' }, { status: 500 })
        }

        return NextResponse.json({ cosechas: cosechas || [] })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
