'use client'
import { useState, useEffect, useRef } from 'react'
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

interface Campo {
    id: number
    name: string
}

export default function ConfigPage() {
    const router = useRouter()
    const telegramIdRef = useRef<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [campos, setCampos] = useState<Campo[]>([])
    const [showAgregar, setShowAgregar] = useState(false)
    const [showInvitar, setShowInvitar] = useState(false)
    const [selectedCampo, setSelectedCampo] = useState<number | null>(null)
    const [inputValue, setInputValue] = useState('')
    const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null)
    const [status, setStatus] = useState('')

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp
            tg.ready()
            tg.setHeaderColor(colors.bg)
            tg.setBackgroundColor(colors.bg)

            const tgId = tg.initDataUnsafe?.user?.id || null
            if (tgId) {
                telegramIdRef.current = tgId
                loadCampos(tgId)
            }
        }
    }, [])

    const loadCampos = async (tgId: number) => {
        try {
            const response = await fetch('/api/telegram/campos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: tgId })
            })
            const data = await response.json()
            if (response.ok) {
                setCampos(data.campos || [])
                if (data.campos?.length > 0) {
                    setSelectedCampo(data.campos[0].id)
                }
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleAgregarCampo = async () => {
        const tgId = telegramIdRef.current
        if (!inputValue.trim() || !tgId) return

        setLoading(true)
        setStatus('')

        const value = inputValue.trim().toUpperCase()
        const isCode = /^[A-Z0-9]{6}$/.test(value)

        try {
            if (isCode) {
                const response = await fetch('/api/telegram/campos/unirse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ telegram_id: tgId, codigo: value })
                })
                const data = await response.json()

                if (!response.ok) {
                    setStatus(data.error)
                    return
                }
                setStatus('Te uniste al campo correctamente')
            } else {
                const response = await fetch('/api/telegram/campos/crear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ telegram_id: tgId, name: inputValue.trim() })
                })
                const data = await response.json()

                if (!response.ok) {
                    setStatus(data.error)
                    return
                }
                setStatus('Campo creado correctamente')
            }

            setInputValue('')
            setShowAgregar(false)
            loadCampos(tgId)
            setTimeout(() => setStatus(''), 3000)
        } catch (error: any) {
            setStatus('Error: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleInvitar = async () => {
        const tgId = telegramIdRef.current
        if (!selectedCampo || !tgId) return

        setLoading(true)
        setCodigoGenerado(null)

        try {
            const response = await fetch('/api/telegram/invitacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: tgId, campo_id: selectedCampo })
            })
            const data = await response.json()

            if (!response.ok) {
                setStatus(data.error)
                return
            }

            setCodigoGenerado(data.codigo)
        } catch (error: any) {
            setStatus('Error: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const copiarCodigo = () => {
        if (codigoGenerado) {
            navigator.clipboard.writeText(codigoGenerado)
            setStatus('Código copiado')
            setTimeout(() => setStatus(''), 2000)
        }
    }

    const BackIcon = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
        </svg>
    )

    const PlusIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="M12 5v14" />
        </svg>
    )

    const LinkIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    )

    const MapPinIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
        </svg>
    )

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
            {/* Header */}
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
                <span style={{ fontSize: '18px', fontWeight: 600 }}>Configuración</span>
            </div>

            {/* Mis campos */}
            <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Mis campos
                </p>
                {campos.length > 0 ? (
                    <div style={{
                        background: colors.card,
                        borderRadius: '10px',
                        border: `1px solid ${colors.cardBorder}`,
                        overflow: 'hidden'
                    }}>
                        {campos.map((campo, i) => (
                            <div
                                key={campo.id}
                                style={{
                                    padding: '14px 16px',
                                    borderBottom: i < campos.length - 1 ? `1px solid ${colors.cardBorder}` : 'none',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                            >
                                <span style={{ color: colors.accent }}><MapPinIcon /></span>
                                {campo.name}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: '13px', color: colors.textDim }}>No tienes campos aún</p>
                )}
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Agregar campo */}
                <button
                    onClick={() => { setShowAgregar(!showAgregar); setShowInvitar(false); setCodigoGenerado(null) }}
                    style={{
                        padding: '14px 16px',
                        borderRadius: '10px',
                        background: colors.card,
                        border: `1px solid ${colors.cardBorder}`,
                        color: colors.text,
                        fontSize: '14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}
                >
                    <span style={{ color: colors.accent }}><PlusIcon /></span>
                    Agregar campo
                </button>

                {showAgregar && (
                    <div style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: colors.card,
                        border: `1px solid ${colors.cardBorder}`,
                        marginLeft: '8px'
                    }}>
                        <input
                            type="text"
                            placeholder="Nombre o código de invitación"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                background: colors.bg,
                                border: `1px solid ${colors.cardBorder}`,
                                color: colors.text,
                                fontSize: '14px',
                                marginBottom: '12px',
                                boxSizing: 'border-box'
                            }}
                        />
                        <button
                            onClick={handleAgregarCampo}
                            disabled={loading || !inputValue.trim()}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                background: inputValue.trim() ? colors.accent : colors.cardBorder,
                                color: inputValue.trim() ? '#000' : colors.textDim,
                                border: 'none',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: inputValue.trim() ? 'pointer' : 'not-allowed'
                            }}
                        >
                            {loading ? 'Procesando...' : 'Continuar'}
                        </button>
                        <p style={{ fontSize: '11px', color: colors.textMuted, marginTop: '12px', lineHeight: 1.4 }}>
                            Ingresá un nombre para crear un campo nuevo, o un código de 6 caracteres para unirte a uno existente.
                        </p>
                    </div>
                )}

                {/* Invitar usuario */}
                {campos.length > 0 && (
                    <>
                        <button
                            onClick={() => { setShowInvitar(!showInvitar); setShowAgregar(false); setCodigoGenerado(null) }}
                            style={{
                                padding: '14px 16px',
                                borderRadius: '10px',
                                background: colors.card,
                                border: `1px solid ${colors.cardBorder}`,
                                color: colors.text,
                                fontSize: '14px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            <span style={{ color: colors.accent }}><LinkIcon /></span>
                            Invitar usuario
                        </button>

                        {showInvitar && (
                            <div style={{
                                padding: '16px',
                                borderRadius: '10px',
                                background: colors.card,
                                border: `1px solid ${colors.cardBorder}`,
                                marginLeft: '8px'
                            }}>
                                {campos.length > 1 && (
                                    <select
                                        value={selectedCampo || ''}
                                        onChange={e => setSelectedCampo(Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            background: colors.bg,
                                            border: `1px solid ${colors.cardBorder}`,
                                            color: colors.text,
                                            fontSize: '14px',
                                            marginBottom: '12px'
                                        }}
                                    >
                                        {campos.map(campo => (
                                            <option key={campo.id} value={campo.id}>{campo.name}</option>
                                        ))}
                                    </select>
                                )}

                                {codigoGenerado ? (
                                    <div
                                        onClick={copiarCodigo}
                                        style={{
                                            padding: '16px',
                                            background: colors.accentDim,
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            border: `1px solid ${colors.accent}30`
                                        }}
                                    >
                                        <p style={{ fontSize: '11px', color: colors.textMuted, margin: '0 0 6px 0' }}>
                                            Toca para copiar
                                        </p>
                                        <p style={{
                                            fontSize: '24px',
                                            fontWeight: 700,
                                            color: colors.accent,
                                            margin: 0,
                                            letterSpacing: '4px',
                                            fontFamily: 'monospace'
                                        }}>
                                            {codigoGenerado}
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleInvitar}
                                        disabled={loading}
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            background: colors.accent,
                                            color: '#000',
                                            border: 'none',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {loading ? 'Generando...' : 'Generar código'}
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Status */}
            {status && (
                <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: status.includes('Error') || status.includes('inválido') ? 'rgba(248, 113, 113, 0.15)' : colors.accentDim,
                    border: `1px solid ${status.includes('Error') || status.includes('inválido') ? colors.error + '30' : colors.accent + '30'}`
                }}>
                    <p style={{
                        textAlign: 'center',
                        fontSize: '13px',
                        margin: 0,
                        color: status.includes('Error') || status.includes('inválido') ? colors.error : colors.accent
                    }}>
                        {status}
                    </p>
                </div>
            )}
        </div>
    )
}