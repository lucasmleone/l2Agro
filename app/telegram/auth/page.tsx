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

            // Colores nativos para que la barra de título se fusione con tu app
            tg.setHeaderColor(tg.themeParams.bg_color || '#212121')
            tg.setBackgroundColor(tg.themeParams.bg_color || '#212121')

            const userId = tg.initDataUnsafe?.user?.id
            if (userId) setTelegramId(userId)
        }
    }, [])

    const handleAuth = async (action: 'LOGIN' | 'REGISTER') => {
        // ... (Mantén esta lógica igual que antes) ...
        if (!telegramId) return setStatus('❌ Sin ID de Telegram')
        if (!email || !password) return setStatus('❌ Faltan datos')

        setLoading(true)
        setStatus(action === 'LOGIN' ? 'Iniciando...' : 'Creando...')

        try {
            let userUuid = null
            if (action === 'LOGIN') {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
                userUuid = data.user.id
            } else {
                const { data, error } = await supabase.auth.signUp({ email, password })
                if (error) throw error
                if (!data.user) throw new Error("Error creando usuario")
                userUuid = data.user.id
            }

            const { error: linkError } = await supabase
                .from('telegram_connections')
                .upsert({ telegram_id: telegramId, user_id: userUuid }, { onConflict: 'telegram_id' })

            if (linkError) throw linkError

            setStatus('✅ ¡Listo!')
            setTimeout(() => router.push('/telegram/config'), 1000)

        } catch (error: any) {
            console.error(error)
            setStatus('❌ ' + (error.message || "Error"))
        } finally {
            setLoading(false)
        }
    }

    return (
        // CAMBIO CLAVE: Quitamos 'min-h-screen' y 'justify-center'.
        // Usamos padding simple para que fluya bien en la ventana pequeña.
        <div className="flex flex-col p-5 font-sans w-full max-w-md mx-auto">

            {/* Encabezado Simple */}
            <div className="text-center mb-6 mt-2">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--tg-text-color)' }}>
                    Bienvenido 🚜
                </h1>
                <p className="text-sm opacity-60" style={{ color: 'var(--tg-hint-color)' }}>
                    Ingresa tus datos para conectar.
                </p>
            </div>

            {/* Formulario Limpio (Sin tarjeta con borde, directo al fondo) */}
            <div className="space-y-4 w-full">

                {/* Input Email */}
                <div>
                    <label className="text-xs font-bold uppercase ml-1 opacity-50 block mb-1">Email</label>
                    <input
                        type="email"
                        className="w-full p-4 rounded-xl outline-none transition-all font-medium"
                        // Usamos el color secundario para el input (resalta sobre el fondo)
                        style={{
                            backgroundColor: 'var(--tg-secondary-bg-color, #2d2d2d)',
                            color: 'var(--tg-text-color)'
                        }}
                        placeholder="ejemplo@campo.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>

                {/* Input Password */}
                <div>
                    <label className="text-xs font-bold uppercase ml-1 opacity-50 block mb-1">Contraseña</label>
                    <input
                        type="password"
                        className="w-full p-4 rounded-xl outline-none transition-all font-medium"
                        style={{
                            backgroundColor: 'var(--tg-secondary-bg-color, #2d2d2d)',
                            color: 'var(--tg-text-color)'
                        }}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>

                {/* Estado */}
                <div className="h-6 flex items-center justify-center">
                    <p className="text-sm font-bold text-blue-500 animate-pulse">{status}</p>
                </div>

                {/* Botones Grandes y Táctiles */}
                <div className="pt-2 space-y-3">
                    <button
                        onClick={() => handleAuth('LOGIN')}
                        disabled={loading}
                        className="w-full font-bold py-4 rounded-xl shadow-sm transform active:scale-95 transition-all disabled:opacity-50 text-lg"
                        style={{
                            backgroundColor: 'var(--tg-button-color, #3390ec)',
                            color: 'var(--tg-button-text-color, #ffffff)'
                        }}
                    >
                        Ingresar
                    </button>

                    <button
                        onClick={() => handleAuth('REGISTER')}
                        disabled={loading}
                        className="w-full font-bold py-4 rounded-xl active:scale-95 transition-all disabled:opacity-50 text-sm opacity-80 hover:opacity-100"
                        // Sin borde, estilo "fantasma" para limpiar ruido visual
                        style={{ color: 'var(--tg-button-color, #3390ec)' }}
                    >
                        ¿No tienes cuenta? Regístrate
                    </button>
                </div>
            </div>

            {/* Debug sutil al pie */}
            {telegramId && (
                <div className="mt-6 text-[10px] text-center opacity-20 uppercase tracking-widest">
                    ID: {telegramId}
                </div>
            )}

        </div>
    )
}