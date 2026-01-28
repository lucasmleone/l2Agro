'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
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

interface Lote {
    id: number
    name: string
    ha?: number
}

interface Cultivo {
    id: number
    name: string
}

function CampanaForm() {
    const router = useRouter()
    const telegramIdRef = useRef<number | null>(null)

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [campos, setCampos] = useState<Campo[]>([])
    const [lotes, setLotes] = useState<Lote[]>([])
    const [cultivos, setCultivos] = useState<Cultivo[]>([])

    const [selectedCampo, setSelectedCampo] = useState<number | null>(null)
    const [selectedLote, setSelectedLote] = useState<number | null>(null)
    const [selectedCultivo, setSelectedCultivo] = useState<number | null>(null)
    const [yearStart, setYearStart] = useState<string>('')
    const [yearEnd, setYearEnd] = useState<string>('')

    const [status, setStatus] = useState('')
    const [isError, setIsError] = useState(false)

    // Años disponibles (actual y próximos)
    const currentYear = new Date().getFullYear()
    const years = [
        { value: String(currentYear - 1).slice(-2), label: String(currentYear - 1).slice(-2) },
        { value: String(currentYear).slice(-2), label: String(currentYear).slice(-2) },
        { value: String(currentYear + 1).slice(-2), label: String(currentYear + 1).slice(-2) },
        { value: String(currentYear + 2).slice(-2), label: String(currentYear + 2).slice(-2) }
    ]

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp
            tg.ready()
            tg.setHeaderColor(colors.bg)
            tg.setBackgroundColor(colors.bg)
            tg.expand()

            const tgId = tg.initDataUnsafe?.user?.id || null
            if (tgId) {
                telegramIdRef.current = tgId
                loadInitialData(tgId)
            } else {
                setLoading(false)
            }
        } else {
            setLoading(false)
        }

        // Default years
        setYearStart(String(currentYear).slice(-2))
        setYearEnd(String(currentYear + 1).slice(-2))
    }, [])

    const loadInitialData = async (tgId: number) => {
        try {
            // Cargar campos
            const camposRes = await fetch('/api/telegram/campos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: tgId })
            })
            const camposData = await camposRes.json()
            if (camposRes.ok && camposData.campos?.length > 0) {
                setCampos(camposData.campos)
                setSelectedCampo(camposData.campos[0].id)
                loadLotes(tgId, camposData.campos[0].id)
            }

            // Cargar cultivos
            const cultivosRes = await fetch('/api/telegram/cultivos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: tgId })
            })
            const cultivosData = await cultivosRes.json()
            if (cultivosRes.ok && cultivosData.cultivos?.length > 0) {
                setCultivos(cultivosData.cultivos)
                setSelectedCultivo(cultivosData.cultivos[0].id)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const loadLotes = async (tgId: number, campoId: number) => {
        try {
            const res = await fetch('/api/telegram/lotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: tgId, campo_id: campoId })
            })
            const data = await res.json()
            if (res.ok) {
                setLotes(data.lotes || [])
                if (data.lotes?.length > 0) {
                    setSelectedLote(data.lotes[0].id)
                } else {
                    setSelectedLote(null)
                }
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleCampoChange = (campoId: number) => {
        setSelectedCampo(campoId)
        setSelectedLote(null)
        setLotes([])
        if (telegramIdRef.current) {
            loadLotes(telegramIdRef.current, campoId)
        }
    }

    // Generar nombre automático
    const generatedName = () => {
        const cultivo = cultivos.find(c => c.id === selectedCultivo)
        if (cultivo && yearStart && yearEnd) {
            return `${cultivo.name} ${yearStart}/${yearEnd}`
        }
        return ''
    }

    const handleSubmit = async () => {
        const tgId = telegramIdRef.current
        if (!tgId || !selectedLote || !selectedCultivo || !yearStart || !yearEnd) {
            setStatus('Completá todos los campos')
            setIsError(true)
            return
        }

        const name = generatedName()
        if (!name) {
            setStatus('Error generando nombre')
            setIsError(true)
            return
        }

        setSubmitting(true)
        setStatus('')
        setIsError(false)

        try {
            const response = await fetch('/api/telegram/campana', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram_id: tgId,
                    lote_id: selectedLote,
                    name
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error)
            }

            setStatus('Campaña creada')
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

    if (!telegramIdRef.current && !loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: colors.bg,
                color: colors.text
            }}>
                <p style={{ fontSize: '16px', marginBottom: '10px' }}>⚠️ Acceso denegado</p>
                <p style={{ fontSize: '13px', color: colors.textMuted }}>
                    Debes abrir esta página desde Telegram.
                </p>
            </div>
        )
    }

    const selectStyle = {
        width: '100%',
        height: '44px',
        padding: '0 14px',
        borderRadius: '8px',
        background: colors.bg,
        border: `1px solid ${colors.cardBorder}`,
        color: colors.text,
        fontSize: '14px'
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
                <span style={{ fontSize: '18px', fontWeight: 600 }}>Nueva campaña</span>
            </div>

            {/* Form */}
            <div style={{
                background: colors.card,
                borderRadius: '12px',
                border: `1px solid ${colors.cardBorder}`,
                padding: '20px'
            }}>
                {/* Campo */}
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
                        onChange={e => handleCampoChange(Number(e.target.value))}
                        style={selectStyle}
                    >
                        {campos.map(campo => (
                            <option key={campo.id} value={campo.id}>{campo.name}</option>
                        ))}
                    </select>
                </div>

                {/* Lote */}
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
                        Lote
                    </label>
                    <select
                        value={selectedLote || ''}
                        onChange={e => setSelectedLote(Number(e.target.value))}
                        style={selectStyle}
                        disabled={lotes.length === 0}
                    >
                        {lotes.length === 0 ? (
                            <option value="">Sin lotes</option>
                        ) : (
                            lotes.map(lote => (
                                <option key={lote.id} value={lote.id}>
                                    {lote.name}{lote.ha ? ` (${lote.ha} ha)` : ''}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                {/* Cultivo */}
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
                        Cultivo
                    </label>
                    <select
                        value={selectedCultivo || ''}
                        onChange={e => setSelectedCultivo(Number(e.target.value))}
                        style={selectStyle}
                        disabled={cultivos.length === 0}
                    >
                        {cultivos.length === 0 ? (
                            <option value="">Sin cultivos</option>
                        ) : (
                            cultivos.map(cultivo => (
                                <option key={cultivo.id} value={cultivo.id}>{cultivo.name}</option>
                            ))
                        )}
                    </select>
                </div>

                {/* Años */}
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
                        Período
                    </label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <select
                            value={yearStart}
                            onChange={e => setYearStart(e.target.value)}
                            style={{ ...selectStyle, flex: 1 }}
                        >
                            {years.map(y => (
                                <option key={y.value} value={y.value}>{y.label}</option>
                            ))}
                        </select>
                        <span style={{ color: colors.textMuted }}>/</span>
                        <select
                            value={yearEnd}
                            onChange={e => setYearEnd(e.target.value)}
                            style={{ ...selectStyle, flex: 1 }}
                        >
                            {years.map(y => (
                                <option key={y.value} value={y.value}>{y.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Preview del nombre */}
                {generatedName() && (
                    <div style={{
                        marginBottom: '16px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: colors.accentDim,
                        border: `1px solid ${colors.accent}30`,
                        textAlign: 'center'
                    }}>
                        <p style={{ fontSize: '11px', color: colors.textMuted, margin: '0 0 4px 0' }}>
                            Nombre de la campaña
                        </p>
                        <p style={{ fontSize: '16px', fontWeight: 600, color: colors.accent, margin: 0 }}>
                            {generatedName()}
                        </p>
                    </div>
                )}

                {/* Status */}
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

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !selectedLote || !selectedCultivo}
                    style={{
                        width: '100%',
                        height: '44px',
                        borderRadius: '8px',
                        background: (submitting || !selectedLote || !selectedCultivo) ? colors.cardBorder : colors.accent,
                        color: (submitting || !selectedLote || !selectedCultivo) ? colors.textDim : '#000',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: (submitting || !selectedLote || !selectedCultivo) ? 'not-allowed' : 'pointer',
                        border: 'none'
                    }}
                >
                    {submitting ? 'Creando...' : 'Crear campaña'}
                </button>
            </div>
        </div>
    )
}

export default function CampanaPage() {
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
            <CampanaForm />
        </Suspense>
    )
}
