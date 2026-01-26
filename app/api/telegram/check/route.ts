import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
    try {
        const { telegram_id } = await request.json()

        if (!telegram_id) {
            return NextResponse.json({ registered: false }, { status: 200 })
        }

        const { data: connection } = await supabaseAdmin
            .from('telegram_connections')
            .select('user_id')
            .eq('telegram_id', telegram_id)
            .single()

        return NextResponse.json({
            registered: !!connection?.user_id,
            user_id: connection?.user_id || null
        })

    } catch (error: any) {
        return NextResponse.json({ registered: false, error: error.message }, { status: 200 })
    }
}
