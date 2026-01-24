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

            // ⚠️ ELIMINAMOS tg.expand() PARA QUE SE ABRA EN MODO COMPACTO

            const userId = tg.initDataUnsafe?.user?.id
            if (userId) {
                setTelegramId(userId)
            } else {
                // setTelegramId(999888777) // Descomentar para probar en PC
                setStatus('⚠️ Abre esta app desde Telegram')
            }
        }
    }, [])

    const handleAuth = async (action: 'LOGIN' | 'REGISTER') => {
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
                if (!data.user) throw new Error("Error al crear usuario")
                userUuid = data.user.id
            }

            const { error: linkError } = await supabase
                .from('telegram_connections')
                .upsert({
                    telegram_id: telegramId,
                    user_id: userUuid,
                }, { onConflict: 'telegram_id' })

            if (linkError) throw linkError

            setStatus('✅ ¡Listo! Redirigiendo...')

            setTimeout(() => {
                router.push('/telegram/config')
            }, 1000)

        } catch (error: any) {
            console.error(error)
            setStatus('❌ ' + (error.message || "Error"))
        } finally {
            setLoading(false)
        }
    }

    return (
        // Usamos min-h-screen pero sin forzar background blanco
        <div className="min-h-screen flex flex-col items-center pt-10 px-6 font-sans">

            {/* Tarjeta con fondo secundario (ligeramente más claro/oscuro que el fondo base) */}
            <div
                className="w-full max-w-sm p-6 rounded-2xl shadow-lg border border-gray-800"
                style={{ backgroundColor: 'var(--tg-secondary-bg-color)' }}
            >
                <h1 className="text-xl font-bold text-center mb-1">L2Agro 🚜</h1>
                <p className="text-xs text-center mb-6 opacity-70">
                    Vincula tu cuenta para comenzar
                </p>

                {telegramId && (
                    <div className="mb-4 text-[10px] text-center opacity-40 uppercase tracking-widest">
                        ID: {telegramId}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <input
                            type="email"
                            className="w-full p-3 rounded-xl outline-none transition-all border border-transparent focus:border-blue-500"
                            style={{
                                backgroundColor: 'var(--tg-bg-color)',
                                color: 'var(--tg-text-color)'
                            }}
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            className="w-full p-3 rounded-xl outline-none transition-all border border-transparent focus:border-blue-500"
                            style={{
                                backgroundColor: 'var(--tg-bg-color)',
                                color: 'var(--tg-text-color)'
                            }}
                            placeholder="Contraseña"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    <p className="text-center text-xs font-bold min-h-[20px] text-blue-400">
                        {status}
                    </p>

                    <button
                        onClick={() => handleAuth('LOGIN')}
                        disabled={loading}
                        className="w-full font-bold py-3 rounded-xl shadow active:scale-95 transition-all disabled:opacity-50"
                        style={{
                            backgroundColor: 'var(--tg-button-color)',
                            color: 'var(--tg-button-text-color)'
                        }}
                    >
                        INGRESAR
                    </button>

                    <button
                        onClick={() => handleAuth('REGISTER')}
                        disabled={loading}
                        className="w-full font-bold py-3 rounded-xl active:scale-95 transition-all disabled:opacity-50"
                        style={{ color: 'var(--tg-button-color)' }}
                    >
                        Crear Cuenta Nueva
                    </button>
                </div>
            </div>
        </div>
    )
}