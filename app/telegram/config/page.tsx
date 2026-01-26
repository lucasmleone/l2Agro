'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

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
            tg.setHeaderColor('#000000')
            tg.setBackgroundColor('#000000')

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
                // Intentar unirse con código
                const response = await fetch('/api/telegram/campos/unirse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ telegram_id: tgId, codigo: value })
                })
                const data = await response.json()

                if (!response.ok) {
                    setStatus('❌ ' + data.error)
                    return
                }
                setStatus('✅ Te uniste al campo')
            } else {
                // Crear campo nuevo
                const response = await fetch('/api/telegram/campos/crear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ telegram_id: tgId, name: inputValue.trim() })
                })
                const data = await response.json()

                if (!response.ok) {
                    setStatus('❌ ' + data.error)
                    return
                }
                setStatus('✅ Campo creado')
            }

            setInputValue('')
            setShowAgregar(false)
            loadCampos(tgId)
        } catch (error: any) {
            setStatus('❌ Error: ' + error.message)
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
                setStatus('❌ ' + data.error)
                return
            }

            setCodigoGenerado(data.codigo)
        } catch (error: any) {
            setStatus('❌ Error: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const copiarCodigo = () => {
        if (codigoGenerado) {
            navigator.clipboard.writeText(codigoGenerado)
            setStatus('📋 Copiado!')
            setTimeout(() => setStatus(''), 2000)
        }
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            padding: '20px',
            backgroundColor: '#000000',
            color: '#ffffff',
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
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(39, 39, 42, 0.6)',
                        border: '1px solid rgba(63, 63, 70, 0.4)',
                        color: '#a1a1aa',
                        fontSize: '16px',
                        cursor: 'pointer'
                    }}
                >
                    ←
                </button>
                <span style={{ fontSize: '18px', fontWeight: 600 }}>Configuración</span>
            </div>

            {/* Mis campos */}
            <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: '#71717a', marginBottom: '8px' }}>Mis campos</p>
                {campos.length > 0 ? (
                    <div style={{
                        background: 'rgba(39, 39, 42, 0.6)',
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }}>
                        {campos.map((campo, i) => (
                            <div
                                key={campo.id}
                                style={{
                                    padding: '14px 16px',
                                    borderBottom: i < campos.length - 1 ? '1px solid rgba(63, 63, 70, 0.4)' : 'none',
                                    fontSize: '14px'
                                }}
                            >
                                📍 {campo.name}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: '13px', color: '#52525b' }}>No tienes campos aún</p>
                )}
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Agregar campo */}
                <button
                    onClick={() => { setShowAgregar(!showAgregar); setShowInvitar(false); setCodigoGenerado(null) }}
                    style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        background: 'rgba(39, 39, 42, 0.6)',
                        border: '1px solid rgba(63, 63, 70, 0.4)',
                        color: '#ffffff',
                        fontSize: '14px',
                        textAlign: 'left',
                        cursor: 'pointer'
                    }}
                >
                    ➕ Agregar campo
                </button>

                {showAgregar && (
                    <div style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'rgba(24, 24, 27, 0.8)',
                        border: '1px solid rgba(63, 63, 70, 0.4)'
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
                                background: 'rgba(39, 39, 42, 0.8)',
                                border: '1px solid rgba(63, 63, 70, 0.6)',
                                color: '#ffffff',
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
                                background: inputValue.trim() ? '#22c55e' : '#27272a',
                                color: '#fff',
                                border: 'none',
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: inputValue.trim() ? 'pointer' : 'not-allowed'
                            }}
                        >
                            {loading ? 'Procesando...' : 'Continuar'}
                        </button>
                        <p style={{ fontSize: '11px', color: '#71717a', marginTop: '12px' }}>
                            💡 Ingresá un nombre para crear un campo nuevo, o un código de 6 letras para unirte a uno existente.
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
                                borderRadius: '12px',
                                background: 'rgba(39, 39, 42, 0.6)',
                                border: '1px solid rgba(63, 63, 70, 0.4)',
                                color: '#ffffff',
                                fontSize: '14px',
                                textAlign: 'left',
                                cursor: 'pointer'
                            }}
                        >
                            🔗 Invitar usuario
                        </button>

                        {showInvitar && (
                            <div style={{
                                padding: '16px',
                                borderRadius: '12px',
                                background: 'rgba(24, 24, 27, 0.8)',
                                border: '1px solid rgba(63, 63, 70, 0.4)'
                            }}>
                                {campos.length > 1 && (
                                    <select
                                        value={selectedCampo || ''}
                                        onChange={e => setSelectedCampo(Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            background: 'rgba(39, 39, 42, 0.8)',
                                            border: '1px solid rgba(63, 63, 70, 0.6)',
                                            color: '#ffffff',
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
                                            background: 'rgba(34, 197, 94, 0.15)',
                                            borderRadius: '10px',
                                            textAlign: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <p style={{ fontSize: '11px', color: '#a1a1aa', margin: '0 0 6px 0' }}>
                                            Toca para copiar
                                        </p>
                                        <p style={{
                                            fontSize: '24px',
                                            fontWeight: 700,
                                            color: '#4ade80',
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
                                            background: '#3b82f6',
                                            color: '#fff',
                                            border: 'none',
                                            fontSize: '13px',
                                            fontWeight: 500,
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
                <p style={{
                    textAlign: 'center',
                    fontSize: '13px',
                    marginTop: '16px',
                    color: status.includes('✅') || status.includes('📋') ? '#4ade80' : '#f87171'
                }}>
                    {status}
                </p>
            )}
        </div>
    )
}