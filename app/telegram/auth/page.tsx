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
            tg.expand()
            // Colores negros para fusión total
            tg.setHeaderColor('#000000')
            tg.setBackgroundColor('#000000')

            const userId = tg.initDataUnsafe?.user?.id
            if (userId) setTelegramId(userId)
        }
    }, [])

    const handleAuth = async (action: 'LOGIN' | 'REGISTER') => {
        if (!telegramId) return setStatus('⚠️ Abre desde Telegram')
        if (!email || !password) return setStatus('⚠️ Faltan datos')
        setLoading(true)
        setStatus('Cargando...')

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
                .upsert({ telegram_id: telegramId, user_id: userUuid }, { onConflict: 'telegram_id' })

            if (linkError) throw linkError

            setStatus('✅ Conectado')
            setTimeout(() => router.push('/telegram/config'), 1000)
        } catch (error: any) {
            console.error(error)
            setStatus('❌ Error: Verifica los datos')
        } finally {
            setLoading(false)
        }
    }

    return (
        // DISEÑO LIMPIO Y ESTRUCTURADO
        <div className="flex flex-col items-center justify-center min-h-screen w-full px-6 bg-black text-white">

            {/* Header */}
            <div className="w-full max-w-sm mb-8 text-center">
                <h1 className="text-3xl font-extrabold tracking-tight mb-2">
                    L2Agro
                </h1>
                <p className="text-gray-400 text-base font-medium">
                    Gestión de campo profesional
                </p>
            </div>

            {/* Formulario */}
            <div className="w-full max-w-sm space-y-5">

                {/* Input Email */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300 ml-1">Email</label>
                    <input
                        type="email"
                        className="w-full h-14 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-lg placeholder-zinc-600 focus:border-blue-500 focus:bg-zinc-800 transition-all outline-none"
                        placeholder="usuario@campo.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>

                {/* Input Password */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300 ml-1">Contraseña</label>
                    <input
                        type="password"
                        className="w-full h-14 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-lg placeholder-zinc-600 focus:border-blue-500 focus:bg-zinc-800 transition-all outline-none"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>

                {/* Estado */}
                <div className="h-6 flex items-center justify-center">
                    <p className="text-sm font-bold text-blue-400 animate-pulse">{status}</p>
                </div>

                {/* Botones Grandes */}
                <div className="space-y-3 pt-2">
                    <button
                        onClick={() => handleAuth('LOGIN')}
                        disabled={loading}
                        className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg active:scale-95 transition-transform"
                    >
                        Ingresar
                    </button>

                    <button
                        onClick={() => handleAuth('REGISTER')}
                        disabled={loading}
                        className="w-full py-4 text-center text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        ¿No tienes cuenta? <span className="text-blue-400 font-bold">Crear una</span>
                    </button>
                </div>

            </div>
        </div>
    )
}
