'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'

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

interface Cosecha {
    id: number
    created_at: string
    rendimiento: number
    humedad: number | null
    Unidades?: { name: string }
}

function DatosDashboard() {
    const router = useRouter()
    const telegramIdRef = useRef<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [lluvias, setLluvias] = useState<Lluvia[]>([])
    const [cosechas, setCosechas] = useState<Cosecha[]>([])

    // Calendario state
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp as any
            tg.ready()
            tg.setHeaderColor(colors.bg)
            tg.setBackgroundColor(colors.bg)
            tg.expand()

            tg.BackButton.show()
            tg.BackButton.onClick(() => router.push('/telegram/home'))

            const user = tg.initDataUnsafe?.user
            const tgId = user?.id || 2
            telegramIdRef.current = tgId
            loadAllData(tgId)
        }
    }, [])

    const loadAllData = async (tgId: number) => {
        try {
            // Cargar lluvias y cosechas en paralelo
            const [lluviasRes, cosechasRes] = await Promise.all([
                fetch(`/api/telegram/lluvias?telegram_id=${tgId}`),
                fetch(`/api/telegram/cosechas?telegram_id=${tgId}`)
            ])

            if (lluviasRes.ok) {
                const data = await lluviasRes.json()
                setLluvias(data.lluvias || [])
            }
            if (cosechasRes.ok) {
                const data = await cosechasRes.json()
                setCosechas(data.cosechas || [])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    // Calendar helpers
    const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
    const getFirstDayOfMonth = (month: number, year: number) => {
        const day = new Date(year, month, 1).getDay()
        return day === 0 ? 6 : day - 1
    }
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

    const prevMonth = () => {
        if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1) }
        else setCalendarMonth(calendarMonth - 1)
    }
    const nextMonth = () => {
        if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1) }
        else setCalendarMonth(calendarMonth + 1)
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

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: colors.bg, color: colors.textMuted }}>
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
            <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>📊 Mis Datos</h1>

            {/* Sección Lluvias - Calendario */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '18px' }}>🌧️</span>
                    <span style={{ fontSize: '16px', fontWeight: 600 }}>Lluvias</span>
                </div>

                <div style={{ background: colors.card, borderRadius: '16px', padding: '16px', border: `1px solid ${colors.cardBorder}` }}>
                    {/* Header mes */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: colors.text, fontSize: '18px', cursor: 'pointer', padding: '4px 8px' }}>‹</button>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{monthNames[calendarMonth]} {calendarYear}</span>
                        <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: colors.text, fontSize: '18px', cursor: 'pointer', padding: '4px 8px' }}>›</button>
                    </div>

                    {/* Días semana */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                            <div key={i} style={{ textAlign: 'center', fontSize: '10px', color: colors.textMuted }}>{d}</div>
                        ))}
                    </div>

                    {/* Grid días */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                        {Array.from({ length: getFirstDayOfMonth(calendarMonth, calendarYear) }).map((_, i) => <div key={`e-${i}`} />)}
                        {Array.from({ length: getDaysInMonth(calendarMonth, calendarYear) }).map((_, i) => {
                            const dia = i + 1
                            const mm = lluviasDelMes[dia]
                            const hasRain = mm !== undefined
                            return (
                                <div key={dia} style={{
                                    aspectRatio: '1',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '4px',
                                    background: hasRain ? colors.accentDim : 'transparent',
                                    color: hasRain ? colors.accent : colors.textMuted,
                                    fontSize: '11px',
                                    fontWeight: hasRain ? 600 : 400
                                }}>
                                    <span>{dia}</span>
                                    {hasRain && <span style={{ fontSize: '7px' }}>{mm}</span>}
                                </div>
                            )
                        })}
                    </div>

                    {/* Total */}
                    <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '13px', color: colors.accent }}>
                        Total: <strong>{totalMes} mm</strong>
                    </div>
                </div>
            </div>

            {/* Sección Cosechas - Lista */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '18px' }}>🌾</span>
                    <span style={{ fontSize: '16px', fontWeight: 600 }}>Cosechas recientes</span>
                </div>

                {cosechas.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {cosechas.slice(0, 5).map(c => (
                            <div key={c.id} style={{
                                background: colors.card,
                                borderRadius: '12px',
                                padding: '12px 16px',
                                border: `1px solid ${colors.cardBorder}`,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '13px', color: colors.textMuted }}>
                                    {new Date(c.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                                </span>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '16px', fontWeight: 600, color: colors.accent }}>{c.rendimiento}</span>
                                    <span style={{ fontSize: '12px', color: colors.textMuted, marginLeft: '4px' }}>{c.Unidades?.name || 'kg/ha'}</span>
                                    {c.humedad && <div style={{ fontSize: '11px', color: colors.textMuted }}>{c.humedad}% hum</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ background: colors.card, borderRadius: '12px', padding: '20px', border: `1px solid ${colors.cardBorder}`, textAlign: 'center', color: colors.textMuted }}>
                        No hay cosechas registradas
                    </div>
                )}
            </div>
        </div>
    )
}

export default function DatosPage() {
    return (
        <Suspense fallback={<div style={{ background: '#0f1419', color: '#71767b', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>}>
            <DatosDashboard />
        </Suspense>
    )
}
