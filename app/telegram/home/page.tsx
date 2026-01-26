'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Campo {
    id: number
    name: string
}

export default function HomePage() {
    const [loading, setLoading] = useState(false)
    const [campos, setCampos] = useState<Campo[]>([])
    const [selectedCampo, setSelectedCampo] = useState<number | null>(null)
    const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null)
    const [telegramId, setTelegramId] = useState<number | null>(null)
    const [status, setStatus] = useState('')
    const [debug, setDebug] = useState('')

    useEffect(() => {
        let tgId: number | null = null

        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp
            tg.ready()
            tg.setHeaderColor('#000000')
            tg.setBackgroundColor('#000000')

            tgId = tg.initDataUnsafe?.user?.id || null
            if (tgId) setTelegramId(tgId)
        }

        if (tgId) {
            loadCampos(tgId)
        } else {
            setStatus('⚠️ Abre desde Telegram')
        }
    }, [])

    const loadCampos = async (tgId: number) => {
        try {
            setDebug(`tgId: ${tgId}`)

            // 1. Obtener user_id desde telegram_id
            const { data: connection, error: connError } = await supabase
                .from('telegram_connections')
                .select('user_id')
                .eq('telegram_id', tgId)
                .single()

            if (connError) {
                setDebug(`Error conn: ${connError.message}`)
                setStatus('❌ Error telegram: ' + connError.message)
                return
            }

            setDebug(`user_id: ${connection?.user_id}`)

            if (!connection?.user_id) {
                setStatus('⚠️ Telegram no vinculado')
                return
            }

            // 2. Obtener campos donde el usuario es dueño (rol_id = 1)
            const { data: camposData, error } = await supabase
                .from('Campos_Usuarios')
                .select('campo_id, Campos(id, name)')
                .eq('user_id', connection.user_id)
                .eq('rol_id', 1)

            if (error) {
                setDebug(`Error campos: ${error.message}`)
                setStatus('❌ Error campos: ' + error.message)
                return
            }

            setDebug(`Campos encontrados: ${camposData?.length || 0}`)

            const camposFormateados = camposData?.map((cu: any) => ({
                id: cu.Campos.id,
                name: cu.Campos.name
            })) || []

            setCampos(camposFormateados)
            if (camposFormateados.length > 0) {
                setSelectedCampo(camposFormateados[0].id)
                setDebug(`OK: ${camposFormateados.length} campos`)
            } else {
                setStatus('⚠️ 0 campos (rol_id=1)')
            }
        } catch (error: any) {
            setDebug(`Catch: ${error.message}`)
            setStatus('❌ Error: ' + error.message)
        }
    }

    const generarCodigo = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let codigo = ''
        for (let i = 0; i < 6; i++) {
            codigo += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return codigo
    }

    const handleGenerarInvitacion = async () => {
        if (!selectedCampo) return setStatus('⚠️ Selecciona un campo')
        setLoading(true)
        setStatus('')
        setCodigoGenerado(null)

        try {
            const codigo = generarCodigo()

            const { error } = await supabase
                .from('invitaciones')
                .insert({ codigo, campo_id: selectedCampo })

            if (error) throw error

            setCodigoGenerado(codigo)
            setStatus('✅ Código generado')
        } catch (error: any) {
            console.error(error)
            setStatus('❌ Error: ' + (error.message || 'No se pudo generar'))
        } finally {
            setLoading(false)
        }
    }

    const copiarCodigo = () => {
        if (codigoGenerado) {
            navigator.clipboard.writeText(codigoGenerado)
            setStatus('📋 Código copiado!')
        }
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                width: '100%',
                padding: '20px 20px 24px',
                backgroundColor: '#000000',
                color: '#ffffff',
                boxSizing: 'border-box',
                minHeight: '100vh'
            }}
        >
            {/* Logo */}
            <div style={{
                marginBottom: '24px',
                textAlign: 'center' as const,
                width: '100%',
                maxWidth: '300px'
            }}>
                <div style={{
                    fontSize: '32px',
                    fontWeight: 800,
                    letterSpacing: '-0.5px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '4px'
                }}>
                    L2Agro
                </div>
                <p style={{
                    color: 'rgba(161, 161, 170, 0.7)',
                    fontSize: '13px',
                    fontWeight: 500,
                    margin: 0
                }}>
                    Panel de control
                </p>
                {/* Debug visible */}
                {debug && (
                    <p style={{
                        color: '#facc15',
                        fontSize: '10px',
                        marginTop: '8px',
                        fontFamily: 'monospace'
                    }}>
                        🔧 {debug}
                    </p>
                )}
            </div>

            {/* Card principal */}
            <div style={{
                width: '100%',
                maxWidth: '300px',
                padding: '20px 18px',
                borderRadius: '16px',
                background: 'rgba(24, 24, 27, 0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(63, 63, 70, 0.4)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}>
                {/* Sección Invitaciones */}
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#ffffff',
                        marginBottom: '12px',
                        marginTop: 0
                    }}>
                        🔗 Generar invitación
                    </h3>

                    {/* Selector de campo */}
                    {campos.length > 0 ? (
                        <>
                            <label style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'rgba(161, 161, 170, 0.9)',
                                marginBottom: '6px',
                                marginLeft: '2px'
                            }}>
                                Campo
                            </label>
                            <select
                                value={selectedCampo || ''}
                                onChange={e => setSelectedCampo(Number(e.target.value))}
                                style={{
                                    width: '100%',
                                    height: '46px',
                                    padding: '0 14px',
                                    borderRadius: '10px',
                                    background: 'rgba(39, 39, 42, 0.8)',
                                    border: '1px solid rgba(63, 63, 70, 0.6)',
                                    color: '#ffffff',
                                    fontSize: '15px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    marginBottom: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                {campos.map(campo => (
                                    <option key={campo.id} value={campo.id}>
                                        {campo.name}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={handleGenerarInvitacion}
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    height: '46px',
                                    borderRadius: '10px',
                                    background: loading
                                        ? 'rgba(34, 197, 94, 0.5)'
                                        : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                    fontSize: '15px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)'
                                }}
                            >
                                {loading ? 'Generando...' : 'Generar código'}
                            </button>
                        </>
                    ) : (
                        <p style={{
                            color: 'rgba(161, 161, 170, 0.7)',
                            fontSize: '13px',
                            textAlign: 'center'
                        }}>
                            No tienes campos como dueño
                        </p>
                    )}

                    {/* Código generado */}
                    {codigoGenerado && (
                        <div
                            onClick={copiarCodigo}
                            style={{
                                marginTop: '16px',
                                padding: '16px',
                                borderRadius: '12px',
                                background: 'rgba(34, 197, 94, 0.15)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                textAlign: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <p style={{
                                fontSize: '12px',
                                color: 'rgba(161, 161, 170, 0.8)',
                                margin: '0 0 8px 0'
                            }}>
                                Código de invitación (toca para copiar)
                            </p>
                            <p style={{
                                fontSize: '28px',
                                fontWeight: 700,
                                color: '#4ade80',
                                margin: 0,
                                letterSpacing: '4px',
                                fontFamily: 'monospace'
                            }}>
                                {codigoGenerado}
                            </p>
                        </div>
                    )}
                </div>

                {/* Estado */}
                {status && (
                    <div style={{
                        textAlign: 'center' as const,
                        marginTop: '16px',
                        padding: '10px',
                        borderRadius: '8px',
                        background: status.includes('✅') || status.includes('📋')
                            ? 'rgba(34, 197, 94, 0.15)'
                            : status.includes('❌')
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(59, 130, 246, 0.15)'
                    }}>
                        <p style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            margin: 0,
                            color: status.includes('✅') || status.includes('📋')
                                ? '#4ade80'
                                : status.includes('❌')
                                    ? '#f87171'
                                    : '#60a5fa'
                        }}>
                            {status}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
