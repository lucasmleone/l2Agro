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

interface Cosecha {
    id: number
    created_at: string
    rendimiento: number
    humedad: number | null
    unidad_id: number
    campana_id: number
    Unidades?: { name: string }
    Campañas?: { name: string, Lotes?: { name: string, Campos?: { name: string } } }
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
    const [cosechas, setCosechas] = useState<Cosecha[]>([])
    const [loadingCosechas, setLoadingCosechas] = useState(false)
    const [selectedCosecha, setSelectedCosecha] = useState<Cosecha | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [deleting, setDeleting] = useState(false)

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
            // Cargar campos y unidades en paralelo (independientes)
            const [camposRes, unidadesRes] = await Promise.all([
                fetch('/api/telegram/campos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ telegram_id: tgId })
                }),
                fetch('/api/telegram/unidades', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ telegram_id: tgId, tipo_unidad_id: 4 })
                })
            ])

            const [camposData, unidadesData] = await Promise.all([
                camposRes.json(),
                unidadesRes.json()
            ])

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
        } catch {
            // Error silencioso
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
        } catch {
            // Error silencioso
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
        } catch {
            // Error silencioso
        } finally {
            setLoadingCampanas(false)
        }
    }

    const loadCosechas = async (tgId: number, campanaId?: number) => {
        setLoadingCosechas(true)
        try {
            const url = campanaId
                ? `/api/telegram/cosechas?telegram_id=${tgId}&campana_id=${campanaId}`
                : `/api/telegram/cosechas?telegram_id=${tgId}`
            const res = await fetch(url)
            const data = await res.json()
            if (res.ok) {
                setCosechas(data.cosechas || [])
            }
        } catch {
            // silencioso
        } finally {
            setLoadingCosechas(false)
        }
    }

    const handleDeleteCosecha = async () => {
        if (!selectedCosecha || !telegramIdRef.current) return
        setDeleting(true)
        try {
            const res = await fetch('/api/telegram/cosecha', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram_id: telegramIdRef.current,
                    cosecha_id: selectedCosecha.id
                })
            })
            if (res.ok) {
                setCosechas(prev => prev.filter(c => c.id !== selectedCosecha.id))
                setShowModal(false)
                setSelectedCosecha(null)
            }
        } catch {
            // silencioso
        } finally {
            setDeleting(false)
        }
    }

    // Cargar cosechas cuando cambia la campaña
    useEffect(() => {
        if (telegramIdRef.current && selectedCampana) {
            loadCosechas(telegramIdRef.current, selectedCampana)
        }
    }, [selectedCampana])

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

                {/* Lista de cosechas registradas */}
                {cosechas.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                        <h3 style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: colors.text,
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span>🌾</span>
                            <span>Cosechas registradas</span>
                            {loadingCosechas && <span style={{ color: colors.textMuted, fontSize: '12px' }}>cargando...</span>}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {cosechas.slice(0, 5).map(cosecha => (
                                <div
                                    key={cosecha.id}
                                    onClick={() => { setSelectedCosecha(cosecha); setShowModal(true) }}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px',
                                        background: colors.card,
                                        borderRadius: '8px',
                                        border: `1px solid ${colors.cardBorder}`,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: '14px', color: colors.text, fontWeight: 500 }}>
                                            {new Date(cosecha.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                        </div>
                                        <div style={{ fontSize: '12px', color: colors.textMuted }}>
                                            {cosecha.humedad ? `${cosecha.humedad}% humedad` : 'Sin humedad'}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        color: colors.accent,
                                        textAlign: 'right'
                                    }}>
                                        <div>{cosecha.rendimiento}</div>
                                        <div style={{ fontSize: '11px', color: colors.textMuted }}>
                                            {cosecha.Unidades?.name || 'kg/ha'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de confirmación */}
            {showModal && selectedCosecha && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: colors.card,
                        borderRadius: '12px',
                        padding: '20px',
                        width: '85%',
                        maxWidth: '320px',
                        border: `1px solid ${colors.cardBorder}`
                    }}>
                        <h3 style={{ fontSize: '16px', color: colors.text, margin: '0 0 16px 0', textAlign: 'center' }}>
                            Registro de cosecha
                        </h3>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: colors.textMuted, fontSize: '13px' }}>Fecha:</span>
                                <span style={{ color: colors.text, fontSize: '13px' }}>
                                    {new Date(selectedCosecha.created_at).toLocaleDateString('es-AR')}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: colors.textMuted, fontSize: '13px' }}>Rendimiento:</span>
                                <span style={{ color: colors.accent, fontSize: '13px', fontWeight: 600 }}>
                                    {selectedCosecha.rendimiento} {selectedCosecha.Unidades?.name || 'kg/ha'}
                                </span>
                            </div>
                            {selectedCosecha.humedad && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: colors.textMuted, fontSize: '13px' }}>Humedad:</span>
                                    <span style={{ color: colors.text, fontSize: '13px' }}>
                                        {selectedCosecha.humedad}%
                                    </span>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => { setShowModal(false); setSelectedCosecha(null) }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: colors.cardBorder,
                                    color: colors.text,
                                    border: 'none',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteCosecha}
                                disabled={deleting}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: colors.error,
                                    color: '#fff',
                                    border: 'none',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: deleting ? 'not-allowed' : 'pointer',
                                    opacity: deleting ? 0.6 : 1
                                }}
                            >
                                {deleting ? 'Eliminando...' : '🗑️ Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
