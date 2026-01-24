'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [telegramId, setTelegramId] = useState<number | null>(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [status, setStatus] = useState('')

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp
            tg.ready()

            // Aseguramos que los colores coincidan
            tg.setHeaderColor(tg.themeParams.bg_color || '#212121')
            tg.setBackgroundColor(tg.themeParams.bg_color || '#212121')

            const userId = tg.initDataUnsafe?.user?.id
            if (userId) setTelegramId(userId)
        }
    }, [])

    const handleAuth = async (action: 'LOGIN' | 'REGISTER') => {
        // ... (Mantén tu lógica de auth igual que antes) ...
        // Solo por brevedad no la copio toda, pero no cambies la lógica
        if (!telegramId) return setStatus('⚠️ Falta ID Telegram')
        if (!email || !password) return setStatus('⚠️ Faltan datos')

        setLoading(true)
        setStatus('Procesando...')

        try {
            let userUuid = null
            if (action === 'LOGIN') {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
                userUuid = data.user.id
            } else {
                const { data, error } = await supabase.auth.signUp({ email, password })
                if (error) throw error
                if (!data.user) throw new Error("Error usuario")
                userUuid = data.user.id
            }

            const { error: linkError } = await supabase
                .from('telegram_connections')
                .upsert({ telegram_id: telegramId, user_id: userUuid }, { onConflict: 'telegram_id' })

            if (linkError) throw linkError

            setStatus('✅ ¡Éxito!')
            setTimeout(() => router.push('/telegram/config'), 1000)
        } catch (error: any) {
            setStatus('❌ Error: Verifica datos')
        } finally {
            setLoading(false)
        }
    }

    return (
        // CAMBIO IMPORTANTE: 'min-h-[50vh]' en vez de screen. 
        // 'justify-start' con padding superior para que no quede todo pegado arriba.
        <div className="flex flex-col w-full px-6 pt-6 pb-10 font-sans mx-auto max-w-md">

            {/* Encabezado */}
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--tg-text-color)' }}>
                    L2Agro 🚜
                </h1>
                <p className="text-sm opacity-60 mt-1" style={{ color: 'var(--tg-hint-color)' }}>
                    Conecta tu cuenta
                </p>
            </div>

            {/* Inputs Grandes */}
            <div className="space-y-4 w-full">
                <input
                    type="email"
                    // h-12 (48px) es el estándar táctil mínimo. text-base (16px) evita zoom.
                    className="w-full h-14 px-4 rounded-xl outline-none text-lg border-2 border-transparent focus:border-blue-500 transition-colors"
                    style={{
                        backgroundColor: 'var(--tg-secondary-bg-color, #2d2d2d)',
                        color: 'var(--tg-text-color)'
                    }}
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    className="w-full h-14 px-4 rounded-xl outline-none text-lg border-2 border-transparent focus:border-blue-500 transition-colors"
                    style={{
                        backgroundColor: 'var(--tg-secondary-bg-color, #2d2d2d)',
                        color: 'var(--tg-text-color)'
                    }}
                    placeholder="Contraseña"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />

                <div className="h-6 flex items-center justify-center">
                    <p className="text-sm font-bold text-blue-500 animate-pulse">
                        {status}
                    </p>
                </div>

                {/* Botones */}
                <div className="pt-2 flex flex-col gap-3">
                    <button
                        onClick={() => handleAuth('LOGIN')}
                        disabled={loading}
                        className="w-full h-14 rounded-xl font-bold text-xl shadow-lg active:scale-95 transition-transform"
                        style={{
                            backgroundColor: 'var(--tg-button-color, #3390ec)',
                            color: 'var(--tg-button-text-color, #ffffff)'
                        }}
                    >
                        INGRESAR
                    </button>

                    <button
                        onClick={() => handleAuth('REGISTER')}
                        disabled={loading}
                        className="w-full py-3 font-medium opacity-60 text-sm hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--tg-text-color)' }}
                    >
                        ¿No tienes cuenta? Crear una
                    </button>
                </div>
            </div>
        </div>
    )
}