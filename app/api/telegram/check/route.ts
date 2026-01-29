/**
 * API: Verificar Registro de Telegram
 * 
 * Endpoint: POST /api/telegram/check
 * 
 * Verifica si un telegram_id ya tiene cuenta vinculada.
 * Usado al cargar la app para decidir si mostrar login o home.
 * 
 * Body: { telegram_id }
 * Response: { registered: boolean, user_id: string | null }
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id } = await request.json()

        if (!telegram_id) {
            return NextResponse.json({ registered: false }, { status: 200 })
        }

        // Buscar conexión existente
        const { data: connection } = await supabaseAdmin
            .from('telegram_connections')
            .select('user_id')
            .eq('telegram_id', telegram_id)
            .single()

        return NextResponse.json({
            registered: !!connection?.user_id,
            user_id: connection?.user_id || null
        })

    } catch (error: unknown) {
        // En caso de error, asumir no registrado (falla segura)
        return NextResponse.json({ registered: false }, { status: 200 })
    }
}
