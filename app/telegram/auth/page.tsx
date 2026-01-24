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
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                width: '100%',
                padding: '24px',
                backgroundColor: '#000000',
                color: '#ffffff',
                boxSizing: 'border-box'
            }}
        >
            {/* Logo con efecto glow */}
            <div style={{
                marginBottom: '40px',
                textAlign: 'center' as const,
                width: '100%',
                maxWidth: '320px'
            }}>
                <div style={{
                    fontSize: '42px',
                    fontWeight: 800,
                    letterSpacing: '-1px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '8px'
                }}>
                    L2Agro
                </div>
                <p style={{
                    color: 'rgba(161, 161, 170, 0.8)',
                    fontSize: '15px',
                    fontWeight: 500,
                    margin: 0
                }}>
                    Gestión de campo profesional
                </p>
            </div>

            {/* Card del formulario con glassmorphism */}
            <div style={{
                width: '100%',
                maxWidth: '320px',
                padding: '28px 24px',
                borderRadius: '20px',
                background: 'rgba(24, 24, 27, 0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(63, 63, 70, 0.4)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
            }}>
                {/* Input Email */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'rgba(161, 161, 170, 0.9)',
                        marginBottom: '8px',
                        marginLeft: '4px'
                    }}>
                        Email
                    </label>
                    <input
                        type="email"
                        className="tg-input"
                        placeholder="usuario@campo.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={{
                            width: '100%',
                            height: '52px',
                            padding: '0 16px',
                            borderRadius: '12px',
                            background: 'rgba(39, 39, 42, 0.8)',
                            border: '1px solid rgba(63, 63, 70, 0.6)',
                            color: '#ffffff',
                            fontSize: '16px',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Input Password */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'rgba(161, 161, 170, 0.9)',
                        marginBottom: '8px',
                        marginLeft: '4px'
                    }}>
                        Contraseña
                    </label>
                    <input
                        type="password"
                        className="tg-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{
                            width: '100%',
                            height: '52px',
                            padding: '0 16px',
                            borderRadius: '12px',
                            background: 'rgba(39, 39, 42, 0.8)',
                            border: '1px solid rgba(63, 63, 70, 0.6)',
                            color: '#ffffff',
                            fontSize: '16px',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Estado */}
                {status && (
                    <div style={{
                        textAlign: 'center' as const,
                        marginBottom: '20px',
                        padding: '10px',
                        borderRadius: '8px',
                        background: status.includes('✅')
                            ? 'rgba(34, 197, 94, 0.15)'
                            : status.includes('❌')
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(59, 130, 246, 0.15)'
                    }}>
                        <p style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            margin: 0,
                            color: status.includes('✅')
                                ? '#4ade80'
                                : status.includes('❌')
                                    ? '#f87171'
                                    : '#60a5fa'
                        }}>
                            {status}
                        </p>
                    </div>
                )}

                {/* Botón Principal */}
                <button
                    onClick={() => handleAuth('LOGIN')}
                    disabled={loading}
                    className="tg-btn-primary"
                    style={{
                        width: '100%',
                        height: '52px',
                        borderRadius: '12px',
                        background: loading
                            ? 'rgba(59, 130, 246, 0.5)'
                            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '16px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        border: 'none',
                        boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                        marginBottom: '16px'
                    }}
                >
                    {loading ? 'Cargando...' : 'Ingresar'}
                </button>

                {/* Link Registro */}
                <button
                    onClick={() => handleAuth('REGISTER')}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '14px',
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(161, 161, 170, 0.9)',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer'
                    }}
                >
                    ¿No tienes cuenta? <span style={{ color: '#60a5fa', fontWeight: 600 }}>Crear una</span>
                </button>
            </div>

            {/* Footer sutil */}
            <p style={{
                marginTop: '32px',
                fontSize: '12px',
                color: 'rgba(113, 113, 122, 0.6)'
            }}>
                Conectado con Telegram
            </p>
        </div>
    )
}
