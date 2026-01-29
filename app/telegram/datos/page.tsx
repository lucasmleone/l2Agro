'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'

// Colores del tema (reutilizados)
const colors = {
    bg: '#0f1419',
    card: '#1a2029',
    cardBorder: '#2a3441',
    accent: '#22c55e',
    accentDim: 'rgba(34, 197, 94, 0.15)',
    text: '#e7e9ea',
    textMuted: '#71767b',
    textDim: '#536471'
}

interface Campo {
    id: number
    name: string
}

function DatosDashboard() {
    const router = useRouter()
    const telegramIdRef = useRef<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [campos, setCampos] = useState<Campo[]>([])
    const [selectedCampo, setSelectedCampo] = useState<number | null>(null)

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp as any
            tg.ready()
            tg.setHeaderColor(colors.bg)
            tg.setBackgroundColor(colors.bg)
            tg.expand()

            // Back button
            tg.BackButton.show()
            tg.BackButton.onClick(() => {
                router.push('/telegram/home')
            })

            const user = tg.initDataUnsafe?.user
            if (user?.id) {
                telegramIdRef.current = user.id
                loadCampos(user.id)
            } else {
                // Dev fallback
                telegramIdRef.current = 2
                loadCampos(2)
            }
        }
    }, [])

    const loadCampos = async (tgId: number) => {
        try {
            const res = await fetch(`/api/telegram/campos?telegram_id=${tgId}`)
            if (res.ok) {
                const data = await res.json()
                setCampos(data.campos || [])
                if (data.campos?.length > 0) {
                    setSelectedCampo(data.campos[0].id)
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
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
            minHeight: '100vh',
            backgroundColor: colors.bg,
            color: colors.text,
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
                📊 Mis Datos
            </h1>

            {/* Selector de Campo */}
            <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: colors.textMuted, fontSize: '12px', marginBottom: '8px' }}>
                    Campo seleccionado
                </label>
                <select
                    value={selectedCampo || ''}
                    onChange={e => setSelectedCampo(Number(e.target.value))}
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        background: colors.card,
                        border: `1px solid ${colors.cardBorder}`,
                        color: colors.text,
                        fontSize: '16px',
                        outline: 'none'
                    }}
                >
                    {campos.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {selectedCampo && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Card Lluvias */}
                    <div
                        onClick={() => router.push(`/telegram/datos/lluvias?campo_id=${selectedCampo}`)}
                        style={{
                            background: colors.card,
                            borderRadius: '16px',
                            padding: '20px',
                            border: `1px solid ${colors.cardBorder}`,
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '20px' }}>🌧️</span>
                                <span style={{ fontSize: '16px', fontWeight: 600 }}>Lluvias</span>
                            </div>
                            <span style={{ color: colors.accent, fontSize: '14px', fontWeight: 500 }}>Ver calendario ›</span>
                        </div>
                        <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>
                            Ver registros históricos y acumulados mensuales
                        </p>
                    </div>

                    {/* Card Cosechas */}
                    <div
                        onClick={() => router.push(`/telegram/datos/cosechas?campo_id=${selectedCampo}`)}
                        style={{
                            background: colors.card,
                            borderRadius: '16px',
                            padding: '20px',
                            border: `1px solid ${colors.cardBorder}`,
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '20px' }}>🌾</span>
                                <span style={{ fontSize: '16px', fontWeight: 600 }}>Cosechas</span>
                            </div>
                            <span style={{ color: colors.accent, fontSize: '14px', fontWeight: 500 }}>Ver listado ›</span>
                        </div>
                        <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>
                            Ver historial de rendimiento y humedad por lote
                        </p>
                    </div>

                    {/* Card Campañas */}
                    <div
                        style={{
                            background: colors.card,
                            borderRadius: '16px',
                            padding: '20px',
                            border: `1px solid ${colors.cardBorder}`,
                            opacity: 0.7
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '20px' }}>📅</span>
                                <span style={{ fontSize: '16px', fontWeight: 600 }}>Campañas</span>
                            </div>
                            <span style={{ color: colors.textDim, fontSize: '12px' }}>Próximamente</span>
                        </div>
                        <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>
                            Gestión de cultivos por ciclo
                        </p>
                    </div>

                </div>
            )}
        </div>
    )
}

export default function DatosPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <DatosDashboard />
        </Suspense>
    )
}
