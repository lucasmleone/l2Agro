'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Colores del tema
const colors = {
    bg: '#0f1419',
    card: '#1a2029',
    cardBorder: '#2a3441',
    accent: '#22c55e',
    accentDim: 'rgba(34, 197, 94, 0.15)',
    text: '#e7e9ea',
    textMuted: '#71767b',
    textDim: '#536471',
    error: '#f87171'
}

export default function AuthPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [telegramId, setTelegramId] = useState<number | null>(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [status, setStatus] = useState('')
    const [isError, setIsError] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp
            tg.ready()
            tg.setHeaderColor(colors.bg)
            tg.setBackgroundColor(colors.bg)

            const userId = tg.initDataUnsafe?.user?.id
            if (userId) {
                setTelegramId(userId)
                checkRegistration(userId)
            } else {
                setLoading(false)
            }
        } else {
            setLoading(false)
        }
    }, [])

    const checkRegistration = async (tgId: number) => {
        try {
            const response = await fetch('/api/telegram/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: tgId })
            })
            const data = await response.json()

            // Si YA está registrado, redirigir a home
            if (data.registered) {
                window.location.href = '/telegram/home'
                return
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleAuth = async (action: 'LOGIN' | 'REGISTER') => {
        if (!telegramId) {
            setStatus('Abre esta página desde Telegram')
            setIsError(true)
            return
        }
        if (!email || !password) {
            setStatus('Completá todos los campos')
            setIsError(true)
            return
        }
        setSubmitting(true)
        setStatus('')
        setIsError(false)

        try {
            const response = await fetch('/api/telegram/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: telegramId, email, password, action })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error en autenticación')
            }

            setStatus('Conectado correctamente')
            setIsError(false)

            // Redirigir a home después del login exitoso
            // Redirigir a home después del login exitoso
            setTimeout(() => {
                window.location.href = '/telegram/home'
            }, 1000)
        } catch (error: any) {
            setStatus(error.message)
            setIsError(true)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: colors.bg,
                color: colors.textMuted
            }}>
                Cargando...
            </div>
        )
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            padding: '20px',
            backgroundColor: colors.bg,
            color: colors.text,
            boxSizing: 'border-box',
            minHeight: '100vh'
        }}>
            {/* Logo */}
            <div style={{
                marginBottom: '32px',
                textAlign: 'center',
                width: '100%',
                maxWidth: '300px'
            }}>
                <div style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: colors.accent,
                    marginBottom: '4px'
                }}>
                    L2Agro
                </div>
                <p style={{
                    color: colors.textMuted,
                    fontSize: '13px',
                    fontWeight: 500,
                    margin: 0
                }}>
                    Gestión de campo profesional
                </p>
            </div>

            {/* Card del formulario */}
            <div style={{
                width: '100%',
                maxWidth: '300px',
                padding: '20px',
                borderRadius: '12px',
                background: colors.card,
                border: `1px solid ${colors.cardBorder}`
            }}>
                {/* Input Email */}
                <div style={{ marginBottom: '14px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: colors.textMuted,
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Email
                    </label>
                    <input
                        type="email"
                        placeholder="usuario@ejemplo.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={{
                            width: '100%',
                            height: '44px',
                            padding: '0 14px',
                            borderRadius: '8px',
                            background: colors.bg,
                            border: `1px solid ${colors.cardBorder}`,
                            color: colors.text,
                            fontSize: '14px',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Input Password */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: colors.textMuted,
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Contraseña
                    </label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{
                            width: '100%',
                            height: '44px',
                            padding: '0 14px',
                            borderRadius: '8px',
                            background: colors.bg,
                            border: `1px solid ${colors.cardBorder}`,
                            color: colors.text,
                            fontSize: '14px',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Estado */}
                {status && (
                    <div style={{
                        marginBottom: '16px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: isError ? 'rgba(248, 113, 113, 0.15)' : colors.accentDim,
                        border: `1px solid ${isError ? colors.error + '30' : colors.accent + '30'}`
                    }}>
                        <p style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            margin: 0,
                            textAlign: 'center',
                            color: isError ? colors.error : colors.accent
                        }}>
                            {status}
                        </p>
                    </div>
                )}

                {/* Botón Principal */}
                <button
                    onClick={() => handleAuth('LOGIN')}
                    disabled={submitting}
                    style={{
                        width: '100%',
                        height: '44px',
                        borderRadius: '8px',
                        background: submitting ? colors.cardBorder : colors.accent,
                        color: submitting ? colors.textDim : '#000',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        border: 'none',
                        marginBottom: '8px'
                    }}
                >
                    {submitting ? 'Cargando...' : 'Ingresar'}
                </button>

                {/* Link Registro */}
                <button
                    onClick={() => handleAuth('REGISTER')}
                    disabled={submitting}
                    style={{
                        width: '100%',
                        padding: '10px',
                        background: 'transparent',
                        border: 'none',
                        color: colors.textMuted,
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer'
                    }}
                >
                    ¿No tenés cuenta? <span style={{ color: colors.accent, fontWeight: 600 }}>Crear una</span>
                </button>
            </div>
        </div>
    )
}
