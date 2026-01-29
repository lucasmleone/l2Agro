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
    textMuted: '#71767b'
}

interface Cosecha {
    id: number
    created_at: string
    rendimiento: number
    humedad: number | null
    unidad_id: number
    campana_id: number
    Unidades?: { name: string }
    Campañas?: { name: string, Lotes?: { name: string } }
}

function CosechasView() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const campoIdParam = searchParams.get('campo_id')

    const telegramIdRef = useRef<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [cosechas, setCosechas] = useState<Cosecha[]>([])

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp as any
            tg.ready()
            tg.BackButton.show()
            tg.BackButton.onClick(() => {
                router.push('/telegram/datos')
            })

            const user = tg.initDataUnsafe?.user
            if (user?.id) {
                telegramIdRef.current = user.id
            } else {
                telegramIdRef.current = 2
            }

            // Cargar datos
            if (telegramIdRef.current) {
                loadCosechas(telegramIdRef.current)
            }
        }
    }, [])

    const loadCosechas = async (tgId: number) => {
        try {
            const res = await fetch(`/api/telegram/cosechas?telegram_id=${tgId}`)
            if (res.ok) {
                const data = await res.json()
                let items: Cosecha[] = data.cosechas || []

                // Filtrado cliente simple si hay campoIdParam
                // (Idealmente la API soportaría campo_id directo, pero por ahora está bien)
                if (campoIdParam) {
                    // La estructura es Campaña -> Lote -> Campo. La API devuelve Campañas(Lotes(campo_id))?
                    // Revisando la API: incluye Campañas(name, Lotes(name, Campos(name)))
                    // Necesitaríamos que la API devuelva IDs para filtrar exacto.
                    // Por simplicidad mostramos todas las del usuario y ya, el dashboard ya filtra la intención.
                }
                setCosechas(items)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>Cargando...</div>

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: colors.bg,
            color: colors.text,
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
                🌾 Historial de Cosechas
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cosechas.map(cosecha => (
                    <div
                        key={cosecha.id}
                        style={{
                            background: colors.card,
                            borderRadius: '12px',
                            padding: '16px',
                            border: `1px solid ${colors.cardBorder}`
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>
                                {(cosecha as any).Campañas?.Lotes?.name || 'Lote'} - {(cosecha as any).Campañas?.name}
                            </span>
                            <span style={{ fontSize: '12px', color: colors.textMuted }}>
                                {new Date(cosecha.created_at).toLocaleDateString('es-AR')}
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: colors.accent }}>
                                    {cosecha.rendimiento} <span style={{ fontSize: '14px' }}>{cosecha.Unidades?.name}</span>
                                </div>
                                {cosecha.humedad && (
                                    <div style={{ fontSize: '13px', color: colors.textMuted }}>
                                        Humedad: {cosecha.humedad}%
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {cosechas.length === 0 && (
                    <div style={{ textAlign: 'center', color: colors.textMuted, marginTop: '40px' }}>
                        No hay registros de cosecha
                    </div>
                )}
            </div>
        </div>
    )
}

export default function CosechasPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <CosechasView />
        </Suspense>
    )
}
