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

interface Lote {
    id: number
    name: string
    ha?: number
}

interface Campana {
    id: number
    name: string
}

interface Unidad {
    id: number
    name: string
}

function CosechaForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const telegramIdRef = useRef<number | null>(null)

    const [loading, setLoading] = useState(true)
    const [loadingLotes, setLoadingLotes] = useState(false)
    const [loadingCampanas, setLoadingCampanas] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [campos, setCampos] = useState<Campo[]>([])
    const [lotes, setLotes] = useState<Lote[]>([])
    const [campanas, setCampanas] = useState<Campana[]>([])
    const [unidades, setUnidades] = useState<Unidad[]>([])

    const [selectedCampo, setSelectedCampo] = useState<number | null>(null)
    const [selectedLote, setSelectedLote] = useState<number | null>(null)
    const [selectedCampana, setSelectedCampana] = useState<number | null>(null)
    const [selectedUnidad, setSelectedUnidad] = useState<number>(4) // Default unidad 4
    const [humedad, setHumedad] = useState('')
    const [rendimiento, setRendimiento] = useState('')

    const [status, setStatus] = useState('')
    const [isError, setIsError] = useState(false)

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

            // Cargar unidades
            const unidadesRes = await fetch('/api/telegram/unidades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: tgId })
            })
            const unidadesData = await unidadesRes.json()

            if (unidadesRes.ok) {
                setUnidades(unidadesData.unidades || [])
            }

            // Leer URL params
            const paramCampo = searchParams.get('campo')
            const paramLote = searchParams.get('lote')
            const paramCampana = searchParams.get('campana')
            const paramHumedad = searchParams.get('humedad')
            const paramRend = searchParams.get('rend')
            const paramUnidad = searchParams.get('unidad')

            if (paramHumedad) setHumedad(paramHumedad)
            if (paramRend) setRendimiento(paramRend)
            if (paramUnidad) setSelectedUnidad(Number(paramUnidad))

            if (camposRes.ok && camposData.campos?.length > 0) {
                setCampos(camposData.campos)

                // Seleccionar campo (de URL o primero)
                const campoId = paramCampo ? Number(paramCampo) : camposData.campos[0].id
                setSelectedCampo(campoId)

                // Cargar lotes del campo
                await loadLotes(tgId, campoId, paramLote ? Number(paramLote) : null, paramCampana ? Number(paramCampana) : null)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const loadLotes = async (tgId: number, campoId: number, preselectedLote?: number | null, preselectedCampana?: number | null) => {
        setLoadingLotes(true)
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
                    const loteId = preselectedLote || data.lotes[0].id
                    setSelectedLote(loteId)
                    await loadCampanas(tgId, loteId, preselectedCampana)
                } else {
                    setSelectedLote(null)
                    setCampanas([])
                    setSelectedCampana(null)
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingLotes(false)
        }
    }

    const loadCampanas = async (tgId: number, loteId: number, preselectedCampana?: number | null) => {
        setLoadingCampanas(true)
        try {
            const res = await fetch('/api/telegram/campanas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: tgId, lote_id: loteId })
            })
            const data = await res.json()
            if (res.ok) {
                setCampanas(data.campanas || [])
                if (data.campanas?.length > 0) {
                    // Seleccionar la preseleccionada o la primera (más reciente)
                    setSelectedCampana(preselectedCampana || data.campanas[0].id)
                } else {
                    setSelectedCampana(null)
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingCampanas(false)
        }
    }

    const handleCampoChange = (campoId: number) => {
        setSelectedCampo(campoId)
        setSelectedLote(null)
        setLotes([])
        setCampanas([])
        setSelectedCampana(null)
        if (telegramIdRef.current) {
            loadLotes(telegramIdRef.current, campoId)
        }
    }

    const handleLoteChange = (loteId: number) => {
        setSelectedLote(loteId)
        setCampanas([])
        setSelectedCampana(null)
        if (telegramIdRef.current) {
            loadCampanas(telegramIdRef.current, loteId)
        }
    }

    const handleSubmit = async () => {
        const tgId = telegramIdRef.current
        if (!tgId || !selectedCampana || !rendimiento) {
            setStatus('Completá todos los campos')
            setIsError(true)
            return
        }

        setSubmitting(true)
        setStatus('')
        setIsError(false)

        try {
            const response = await fetch('/api/telegram/cosecha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram_id: tgId,
                    campana_id: selectedCampana,
                    humedad: humedad || null,
                    rendimiento,
                    unidad_id: selectedUnidad
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error)
            }

            setStatus('Cosecha registrada')
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

    const inputStyle = {
        ...selectStyle,
        boxSizing: 'border-box' as const
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
                <span style={{ fontSize: '18px', fontWeight: 600 }}>Registrar cosecha</span>
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
                        onChange={e => handleLoteChange(Number(e.target.value))}
                        style={selectStyle}
                        disabled={loadingLotes || lotes.length === 0}
                    >
                        {loadingLotes ? (
                            <option value="">Cargando...</option>
                        ) : lotes.length === 0 ? (
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

                {/* Campaña */}
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
                        Campaña
                    </label>
                    <select
                        value={selectedCampana || ''}
                        onChange={e => setSelectedCampana(Number(e.target.value))}
                        style={selectStyle}
                        disabled={loadingCampanas || campanas.length === 0}
                    >
                        {loadingCampanas ? (
                            <option value="">Cargando...</option>
                        ) : campanas.length === 0 ? (
                            <option value="">Sin campañas</option>
                        ) : (
                            campanas.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))
                        )}
                    </select>
                </div>

                {/* Humedad */}
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
                        Humedad (%)
                    </label>
                    <input
                        type="number"
                        inputMode="decimal"
                        placeholder="Ej: 14.5"
                        value={humedad}
                        onChange={e => setHumedad(e.target.value)}
                        step="0.1"
                        min="0"
                        max="100"
                        style={inputStyle}
                    />
                </div>

                {/* Rendimiento + Unidad */}
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
                        Rendimiento
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                            type="number"
                            inputMode="decimal"
                            placeholder="Ej: 2500"
                            value={rendimiento}
                            onChange={e => setRendimiento(e.target.value)}
                            step="0.1"
                            min="0"
                            style={{ ...inputStyle, flex: 2 }}
                        />
                        <select
                            value={selectedUnidad}
                            onChange={e => setSelectedUnidad(Number(e.target.value))}
                            style={{ ...selectStyle, flex: 1 }}
                        >
                            {unidades.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

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
                    disabled={submitting || !selectedCampana || !rendimiento}
                    style={{
                        width: '100%',
                        height: '44px',
                        borderRadius: '8px',
                        background: (submitting || !selectedCampana || !rendimiento) ? colors.cardBorder : colors.accent,
                        color: (submitting || !selectedCampana || !rendimiento) ? colors.textDim : '#000',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: (submitting || !selectedCampana || !rendimiento) ? 'not-allowed' : 'pointer',
                        border: 'none'
                    }}
                >
                    {submitting ? 'Registrando...' : 'Registrar cosecha'}
                </button>
            </div>
        </div>
    )
}

export default function CosechaPage() {
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
            <CosechaForm />
        </Suspense>
    )
}
