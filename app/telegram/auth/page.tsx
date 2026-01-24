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

            // Forzamos los colores de la barra de Telegram para que se funda con la app
            const bgColor = tg.themeParams.bg_color || '#212121'
            tg.setHeaderColor(bgColor)
            tg.setBackgroundColor(bgColor)

            const userId = tg.initDataUnsafe?.user?.id
            if (userId) setTelegramId(userId)
        }
    }, [])

    const handleAuth = async (action: 'LOGIN' | 'REGISTER') => {
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
            console.error(error)
            setStatus('❌ Error: Verifica datos')
        } finally {
            setLoading(false)
        }
    }

    return (
        // DISEÑO CORRECTO:
        // 1. Usamos var(--tg-theme-...) que ahora SÍ existen en CSS.
        // 2. Padding seguro para que no se pegue a los bordes.
        <div className="flex flex-col items-center w-full min-h-screen px-5 pt-8 pb-10 font-sans">

            {/* Título */}
            <div className="w-full text-center mb-8">
                <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--tg-theme-text-color)' }}>
                    L2Agro 🚜
                </h1>
                <p className="text-base opacity-60" style={{ color: 'var(--tg-theme-hint-color)' }}>
                    Gestión de Campo
                </p>
            </div>

            {/* Formulario */}
            <div className="w-full max-w-sm space-y-5">

                {/* Inputs con fondo secundario para contraste */}
                <div>
                    <label className="text-xs font-bold uppercase mb-1 ml-1 block opacity-50">Email</label>
                    <input
                        type="email"
                        className="w-full h-12 px-4 rounded-xl outline-none font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-500/50"
                        style={{
                            backgroundColor: 'var(--tg-theme-secondary-bg-color, #2d2d2d)',
                            color: 'var(--tg-theme-text-color)',
                            borderColor: 'transparent'
                        }}
                        placeholder="tu@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-xs font-bold uppercase mb-1 ml-1 block opacity-50">Contraseña</label>
                    <input
                        type="password"
                        className="w-full h-12 px-4 rounded-xl outline-none font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-500/50"
                        style={{
                            backgroundColor: 'var(--tg-theme-secondary-bg-color, #2d2d2d)',
                            color: 'var(--tg-theme-text-color)',
                            borderColor: 'transparent'
                        }}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>

                {/* Mensaje de Estado */}
                <div className="h-6 flex items-center justify-center">
                    <p className="text-sm font-bold animate-pulse" style={{ color: 'var(--tg-theme-button-color)' }}>
                        {status}
                    </p>
                </div>

                {/* Botones */}
                <div className="flex flex-col gap-3 mt-2">
                    <button
                        onClick={() => handleAuth('LOGIN')}
                        disabled={loading}
                        className="w-full h-12 rounded-xl font-bold text-lg shadow-md active:scale-95 transition-transform"
                        style={{
                            backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
                            color: 'var(--tg-theme-button-text-color, #ffffff)'
                        }}
                    >
                        Ingresar
                    </button>

                    <button
                        onClick={() => handleAuth('REGISTER')}
                        disabled={loading}
                        className="w-full py-3 font-medium text-sm opacity-60 hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--tg-theme-text-color)' }}
                    >
                        ¿No tienes cuenta? Regístrate
                    </button>
                </div>
            </div>
        </div>
    )
}