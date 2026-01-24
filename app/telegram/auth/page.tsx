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
        // Configuración segura de Telegram
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp
            tg.ready()

            // Expandimos para asegurar que ocupe el espacio correctamente y no quede "corto"
            tg.expand()

            // Pintamos la cabecera del mismo color que nuestro fondo
            tg.setHeaderColor('#09090b')
            tg.setBackgroundColor('#09090b')

            const userId = tg.initDataUnsafe?.user?.id
            if (userId) setTelegramId(userId)
        }
    }, [])

    const handleAuth = async (action: 'LOGIN' | 'REGISTER') => {
        if (!telegramId) return setStatus('⚠️ Error: Abre desde Telegram')
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
                if (!data.user) throw new Error("No se pudo crear el usuario")
                userUuid = data.user.id
            }

            const { error: linkError } = await supabase
                .from('telegram_connections')
                .upsert({ telegram_id: telegramId, user_id: userUuid }, { onConflict: 'telegram_id' })

            if (linkError) throw linkError

            setStatus('✅ ¡Conectado!')
            setTimeout(() => router.push('/telegram/config'), 1000)

        } catch (error: any) {
            console.error(error)
            setStatus('❌ Error: Datos inválidos')
        } finally {
            setLoading(false)
        }
    }

    return (
        // DISEÑO SOLIDO: Fondo oscuro fijo, centrado y limpio.
        <div className="flex flex-col items-center justify-center min-h-screen w-full px-6 bg-zinc-950 text-white font-sans">

            {/* Tarjeta Visualmente Limpia */}
            <div className="w-full max-w-sm space-y-6">

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        L2Agro 🚜
                    </h1>
                    <p className="text-zinc-400 text-sm">
                        Gestión de campo profesional
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Input Email */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-zinc-500 ml-1">Email</label>
                        <input
                            type="email"
                            className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            placeholder="nombre@campo.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    {/* Input Password */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-zinc-500 ml-1">Contraseña</label>
                        <input
                            type="password"
                            className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    {/* Estado */}
                    <div className="h-6 flex items-center justify-center">
                        <p className="text-sm font-medium text-blue-400 animate-pulse">{status}</p>
                    </div>

                    {/* Botones - Colores FIJOS (Azul real) */}
                    <div className="pt-2 space-y-3">
                        <button
                            onClick={() => handleAuth('LOGIN')}
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Iniciar Sesión
                        </button>

                        <button
                            onClick={() => handleAuth('REGISTER')}
                            disabled={loading}
                            className="w-full py-3 text-sm text-zinc-400 font-medium hover:text-white transition-colors"
                        >
                            ¿No tienes cuenta? <span className="text-blue-400">Regístrate aquí</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}