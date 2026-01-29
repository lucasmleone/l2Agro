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

interface Lluvia {
    id: number
    created_at: string
    milimetros: number
    campo_id: number
}

function LluviasView() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const campoIdParam = searchParams.get('campo_id')

    const telegramIdRef = useRef<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [lluvias, setLluvias] = useState<Lluvia[]>([])
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp as any
            tg.ready()
            tg.setHeaderColor(colors.bg)
            tg.setBackgroundColor(colors.bg)

            tg.BackButton.show()
            tg.BackButton.onClick(() => {
                router.push('/telegram/datos')
            })

            const user = tg.initDataUnsafe?.user
            if (user?.id) {
                telegramIdRef.current = user.id
            } else {
                telegramIdRef.current = 2 // fallback dev
            }

            if (telegramIdRef.current && campoIdParam) {
                loadLluvias(telegramIdRef.current, Number(campoIdParam))
            } else {
                setLoading(false)
            }
        }
    }, [campoIdParam])

    const loadLluvias = async (tgId: number, campoId: number) => {
        try {
            const res = await fetch(`/api/telegram/lluvias?telegram_id=${tgId}&campo_id=${campoId}`)
            if (res.ok) {
                const data = await res.json()
                setLluvias(data.lluvias || [])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    // Funciones calendario
    const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
    const getFirstDayOfMonth = (month: number, year: number) => {
        const day = new Date(year, month, 1).getDay()
        return day === 0 ? 6 : day - 1
    }

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

    const prevMonth = () => {
        if (calendarMonth === 0) {
            setCalendarMonth(11)
            setCalendarYear(calendarYear - 1)
        } else {
            setCalendarMonth(calendarMonth - 1)
        }
    }

    const nextMonth = () => {
        if (calendarMonth === 11) {
            setCalendarMonth(0)
            setCalendarYear(calendarYear + 1)
        } else {
            setCalendarMonth(calendarMonth + 1)
        }
    }

    const lluviasDelMes = lluvias.reduce((acc, l) => {
        const d = new Date(l.created_at)
        if (d.getMonth() === calendarMonth && d.getFullYear() === calendarYear) {
            const dia = d.getDate()
            acc[dia] = (acc[dia] || 0) + l.milimetros
        }
        return acc
    }, {} as Record<number, number>)

    const totalMes = Object.values(lluviasDelMes).reduce((a, b) => a + b, 0)

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
                🌧️ Calendario de Lluvias
            </h1>

            <div style={{
                background: colors.card,
                borderRadius: '16px',
                padding: '16px',
                border: `1px solid ${colors.cardBorder}`
            }}>
                {/* Header mes */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                }}>
                    <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: colors.text, fontSize: '20px', cursor: 'pointer' }}>‹</button>
                    <span style={{ fontSize: '16px', fontWeight: 600 }}>{monthNames[calendarMonth]} {calendarYear}</span>
                    <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: colors.text, fontSize: '20px', cursor: 'pointer' }}>›</button>
                </div>

                {/* Días semana */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' }}>
                    {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: '12px', color: colors.textMuted }}>{d}</div>
                    ))}
                </div>

                {/* Grid días */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {Array.from({ length: getFirstDayOfMonth(calendarMonth, calendarYear) }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}

                    {Array.from({ length: getDaysInMonth(calendarMonth, calendarYear) }).map((_, i) => {
                        const dia = i + 1
                        const mm = lluviasDelMes[dia]
                        const hasRain = mm !== undefined
                        const intensity = hasRain ? Math.min(mm / 50, 1) : 0

                        return (
                            <div key={dia} style={{
                                aspectRatio: '1',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '8px',
                                background: hasRain ? `rgba(34, 197, 94, ${0.15 + intensity * 0.5})` : 'transparent',
                                color: hasRain ? colors.accent : colors.textMuted,
                                fontSize: '12px',
                                fontWeight: hasRain ? 600 : 400
                            }}>
                                <span>{dia}</span>
                                {hasRain && <span style={{ fontSize: '9px' }}>{mm}</span>}
                            </div>
                        )
                    })}
                </div>

                {/* Footer Total */}
                <div style={{ marginTop: '16px', textAlign: 'center', borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '12px' }}>
                    <span style={{ color: colors.textMuted, fontSize: '14px' }}>Total mensual: </span>
                    <strong style={{ color: colors.accent, fontSize: '16px' }}>{totalMes} mm</strong>
                </div>
            </div>
        </div>
    )
}

export default function LluviasPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <LluviasView />
        </Suspense>
    )
}
