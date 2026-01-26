'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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

interface Campo {
    id: number
    name: string
}

function LluviaForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const telegramIdRef = useRef<number | null>(null)

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [campos, setCampos] = useState<Campo[]>([])
    const [selectedCampo, setSelectedCampo] = useState<number | null>(null)
    const [fecha, setFecha] = useState('')
    const [mm, setMm] = useState('')
    const [status, setStatus] = useState('')
    const [isError, setIsError] = useState(false)

    useEffect(() => {
        const hoy = new Date().toISOString().split('T')[0]
        setFecha(hoy)

        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp
            tg.ready()
            tg.setHeaderColor(colors.bg)
            tg.setBackgroundColor(colors.bg)

            const tgId = tg.initDataUnsafe?.user?.id || null
            if (tgId) {
                telegramIdRef.current = tgId
                loadCampos(tgId)
            } else {
                setLoading(false)
            }
        } else {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const paramCampo = searchParams.get('campo')
        const paramFecha = searchParams.get('fecha')
        const paramMm = searchParams.get('mm')

        if (paramCampo) setSelectedCampo(parseInt(paramCampo))
        if (paramFecha) setFecha(paramFecha)
        if (paramMm) setMm(paramMm)
    }, [searchParams])

    const loadCampos = async (tgId: number) => {
        try {
            const response = await fetch('/api/telegram/campos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: tgId })
            })
            const data = await response.json()

            if (response.ok && data.campos?.length > 0) {
                setCampos(data.campos)
                if (!searchParams.get('campo')) {
                    setSelectedCampo(data.campos[0].id)
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        const tgId = telegramIdRef.current
        if (!tgId || !selectedCampo || !fecha || !mm) {
            setStatus('Completá todos los campos')
            setIsError(true)
            return
        }

        setSubmitting(true)
        setStatus('')
        setIsError(false)

        try {
            const response = await fetch('/api/telegram/lluvia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram_id: tgId,
                    campo_id: selectedCampo,
                    fecha,
                    mm: parseFloat(mm)
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error)
            }

            setStatus('Registro guardado')
            setIsError(false)

            setTimeout(() => {
                router.push('/telegram/home')
            }, 1500)
        } catch (error: any) {
            setStatus(error.message)
            setIsError(true)
        } finally {
            setSubmitting(false)
        }
    }

    const BackIcon = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
        </svg>
    )

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
            width: '100%',
            padding: '20px',
            backgroundColor: colors.bg,
            color: colors.text,
            minHeight: '100vh',
            boxSizing: 'border-box'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px'
            }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: colors.card,
                        border: `1px solid ${colors.cardBorder}`,
                        color: colors.textMuted,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <BackIcon />
                </button>
                <span style={{ fontSize: '18px', fontWeight: 600 }}>Registrar lluvia</span>
            </div>

            <div style={{
                background: colors.card,
                borderRadius: '12px',
                border: `1px solid ${colors.cardBorder}`,
                padding: '20px'
            }}>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: colors.textMuted,
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Campo
                    </label>
                    <select
                        value={selectedCampo || ''}
                        onChange={e => setSelectedCampo(Number(e.target.value))}
                        style={{
                            width: '100%',
                            height: '44px',
                            padding: '0 14px',
                            borderRadius: '8px',
                            background: colors.bg,
                            border: `1px solid ${colors.cardBorder}`,
                            color: colors.text,
                            fontSize: '14px'
                        }}
                    >
                        {campos.map(campo => (
                            <option key={campo.id} value={campo.id}>{campo.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: colors.textMuted,
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Fecha
                    </label>
                    <input
                        type="date"
                        value={fecha}
                        onChange={e => setFecha(e.target.value)}
                        style={{
                            width: '100%',
                            height: '44px',
                            padding: '0 14px',
                            borderRadius: '8px',
                            background: colors.bg,
                            border: `1px solid ${colors.cardBorder}`,
                            color: colors.text,
                            fontSize: '14px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

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
                        Milímetros
                    </label>
                    <input
                        type="number"
                        placeholder="Ej: 24"
                        value={mm}
                        onChange={e => setMm(e.target.value)}
                        step="0.1"
                        min="0"
                        style={{
                            width: '100%',
                            height: '44px',
                            padding: '0 14px',
                            borderRadius: '8px',
                            background: colors.bg,
                            border: `1px solid ${colors.cardBorder}`,
                            color: colors.text,
                            fontSize: '14px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

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

                <button
                    onClick={handleSubmit}
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
                        border: 'none'
                    }}
                >
                    {submitting ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </div>
    )
}

export default function LluviaPage() {
    return (
        <Suspense fallback={
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#0f1419',
                color: '#71767b'
            }}>
                Cargando...
            </div>
        }>
            <LluviaForm />
        </Suspense>
    )
}
