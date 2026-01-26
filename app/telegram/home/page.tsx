'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Campo {
    id: number
    name: string
}

export default function HomePage() {
    const router = useRouter()
    const telegramIdRef = useRef<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [loadingCampos, setLoadingCampos] = useState(true)
    const [campos, setCampos] = useState<Campo[]>([])
    const [selectedCampo, setSelectedCampo] = useState<number | null>(null)
    const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null)
    const [showInvitacion, setShowInvitacion] = useState(false)
    const [showCrearCampo, setShowCrearCampo] = useState(false)
    const [nuevoCampoNombre, setNuevoCampoNombre] = useState('')
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
            } else {
                setStatus('⚠️ Abre desde Telegram')
                setLoadingCampos(false)
            }
        } else {
            setStatus('⚠️ Abre desde Telegram')
            setLoadingCampos(false)
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

            if (!response.ok) {
                if (data.redirect) {
                    router.push(data.redirect)
                    return
                }
                setStatus('❌ ' + data.error)
                return
            }

            setCampos(data.campos)
            if (data.campos.length > 0) {
                setSelectedCampo(data.campos[0].id)
            }
        } catch (error: any) {
            setStatus('❌ Error: ' + error.message)
        } finally {
            setLoadingCampos(false)
        }
    }

    const handleGenerarInvitacion = async () => {
        const tgId = telegramIdRef.current
        if (!selectedCampo || !tgId) {
            setStatus('⚠️ Selecciona un campo')
            return
        }
        setLoading(true)
        setStatus('')
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

    const handleCrearCampo = async () => {
        const tgId = telegramIdRef.current
        if (!nuevoCampoNombre.trim() || !tgId) {
            setStatus('⚠️ Ingresa un nombre')
            return
        }
        setLoading(true)
        setStatus('')

        try {
            const response = await fetch('/api/telegram/campos/crear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: tgId, name: nuevoCampoNombre.trim() })
            })

            const data = await response.json()

            if (!response.ok) {
                setStatus('❌ ' + data.error)
                return
            }

            setStatus('✅ Campo creado')
            setNuevoCampoNombre('')
            setShowCrearCampo(false)
            loadCampos(tgId)
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

    const btnStyle = {
        width: '100%',
        padding: '14px',
        borderRadius: '10px',
        background: 'rgba(39, 39, 42, 0.8)',
        border: '1px solid rgba(63, 63, 70, 0.6)',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        textAlign: 'left' as const,
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            padding: '20px',
            backgroundColor: '#000000',
            color: '#ffffff',
            minHeight: '100vh',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', textAlign: 'center', width: '100%' }}>
                <div style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    L2Agro
                </div>
            </div>

            {/* Card */}
            <div style={{
                width: '100%',
                maxWidth: '320px',
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(24, 24, 27, 0.6)',
                border: '1px solid rgba(63, 63, 70, 0.4)'
            }}>
                {loadingCampos ? (
                    <p style={{ textAlign: 'center', color: '#a1a1aa' }}>Cargando...</p>
                ) : (
                    <>
                        {/* Selector de campo actual */}
                        {campos.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '11px', color: '#71717a', marginBottom: '4px', display: 'block' }}>
                                    Campo activo
                                </label>
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
                                        fontSize: '15px'
                                    }}
                                >
                                    {campos.map(campo => (
                                        <option key={campo.id} value={campo.id}>{campo.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Menú de acciones */}
                        <div>
                            <button onClick={() => setShowCrearCampo(!showCrearCampo)} style={btnStyle}>
                                ➕ Crear campo
                            </button>

                            {showCrearCampo && (
                                <div style={{ marginBottom: '12px', marginLeft: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="Nombre del campo"
                                        value={nuevoCampoNombre}
                                        onChange={e => setNuevoCampoNombre(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            background: 'rgba(24, 24, 27, 0.8)',
                                            border: '1px solid rgba(63, 63, 70, 0.6)',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            marginBottom: '8px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    <button
                                        onClick={handleCrearCampo}
                                        disabled={loading}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            background: '#22c55e',
                                            color: '#fff',
                                            border: 'none',
                                            fontSize: '13px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {loading ? 'Creando...' : 'Crear'}
                                    </button>
                                </div>
                            )}

                            {campos.length > 0 && (
                                <>
                                    <button onClick={() => { setShowInvitacion(!showInvitacion); setCodigoGenerado(null) }} style={btnStyle}>
                                        🔗 Invitar usuario
                                    </button>

                                    {showInvitacion && (
                                        <div style={{ marginBottom: '12px', marginLeft: '8px' }}>
                                            {codigoGenerado ? (
                                                <div
                                                    onClick={copiarCodigo}
                                                    style={{
                                                        padding: '12px',
                                                        background: 'rgba(34, 197, 94, 0.15)',
                                                        borderRadius: '8px',
                                                        textAlign: 'center',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <p style={{ fontSize: '10px', color: '#a1a1aa', margin: '0 0 4px 0' }}>
                                                        Toca para copiar
                                                    </p>
                                                    <p style={{
                                                        fontSize: '22px',
                                                        fontWeight: 700,
                                                        color: '#4ade80',
                                                        margin: 0,
                                                        letterSpacing: '3px',
                                                        fontFamily: 'monospace'
                                                    }}>
                                                        {codigoGenerado}
                                                    </p>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={handleGenerarInvitacion}
                                                    disabled={loading}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '6px',
                                                        background: '#3b82f6',
                                                        color: '#fff',
                                                        border: 'none',
                                                        fontSize: '13px',
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

                        {/* Estado */}
                        {status && (
                            <p style={{
                                textAlign: 'center',
                                fontSize: '13px',
                                marginTop: '12px',
                                color: status.includes('✅') || status.includes('📋') ? '#4ade80' :
                                    status.includes('❌') ? '#f87171' : '#60a5fa'
                            }}>
                                {status}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
