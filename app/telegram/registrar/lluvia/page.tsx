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

interface Lluvia {
    id: number
    created_at: string
    milimetros: number
    campo_id: number
    Campos?: { name: string }
}

function LluviaForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const telegramIdRef = useRef<number | null>(null)

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [campos, setCampos] = useState<Campo[]>([])
    const [selectedCampo, setSelectedCampo] = useState<number | null>(null)
    const [fecha, setFecha] = useState('')
    const [mm, setMm] = useState('')
    const [status, setStatus] = useState('')
    const [isError, setIsError] = useState(false)
    const [debugInfo, setDebugInfo] = useState('')
    const [lluvias, setLluvias] = useState<Lluvia[]>([])
    const [loadingLluvias, setLoadingLluvias] = useState(false)
    const [selectedLluvia, setSelectedLluvia] = useState<Lluvia | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [deleting, setDeleting] = useState(false)

    // Función para parsear start_param de Telegram
    // Formato esperado: campo-1__fecha-2025-02-21__mm-20
    const parseStartParam = (param: string) => {
        const parts = param.split('__')
        const data: any = {}
        parts.forEach(part => {
            const [key, value] = part.split('-')
            if (key && value) data[key] = value
        })
        return data
    }

    useEffect(() => {
        const hoy = new Date().toISOString().split('T')[0]
        setFecha(hoy)

        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp
            tg.ready()
            tg.setHeaderColor(colors.bg)
            tg.setBackgroundColor(colors.bg)
            tg.expand() // Expandir para mejor visibilidad

            const tgId = tg.initDataUnsafe?.user?.id || null
            const startParam = tg.initDataUnsafe?.start_param

            if (tgId) {
                telegramIdRef.current = tgId
                loadCampos(tgId)

                // Si hay start_param, usarlos
                if (startParam) {
                    const data = parseStartParam(startParam)
                    if (data.campo) setSelectedCampo(parseInt(data.campo))
                    if (data.fecha) setFecha(data.fecha)
                    if (data.mm) setMm(data.mm)
                    setDebugInfo(`Params received: ${startParam}`)
                }
            } else {
                setLoading(false)
                setDebugInfo('No se detectó usuario de Telegram. Abre desde la App.')
            }
        } else {
            setLoading(false)
            setDebugInfo('Telegram WebApp no detectada.')
        }
    }, [])

    // Soporte legacy para URL params normales (útil para dev)
    useEffect(() => {
        const paramCampo = searchParams.get('campo')
        const paramFecha = searchParams.get('fecha')
        const paramMm = searchParams.get('mm')

        if (paramCampo) setSelectedCampo(parseInt(paramCampo))
        if (paramFecha) setFecha(paramFecha)
        if (paramMm) setMm(paramMm)
    }, [searchParams])

    const loadCampos = async (tgId: number) => {
        try {
            const response = await fetch('/api/telegram/campos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: tgId })
            })
            const data = await response.json()

            if (response.ok && data.campos?.length > 0) {
                setCampos(data.campos)
                // Solo setear default si no hay seleccionado
                if (!selectedCampo) {
                    // Esperar un tick para ver si useEffect de params setea algo
                    setTimeout(() => {
                        setSelectedCampo(prev => prev || data.campos[0].id)
                    }, 100)
                }
            }
        } catch {
            // Error silencioso - se muestran errores en UI
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        const tgId = telegramIdRef.current
        if (!tgId || !selectedCampo || !fecha || !mm) {
            setStatus('Completá todos los campos')
            setIsError(true)
            return
        }

        setSubmitting(true)
        setStatus('')
        setIsError(false)

        try {
            const response = await fetch('/api/telegram/lluvia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram_id: tgId,
                    campo_id: selectedCampo,
                    fecha,
                    mm: parseFloat(mm)
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error)
            }

            setStatus('Registro guardado')
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

    const loadLluvias = async (tgId: number, campoId?: number) => {
        setLoadingLluvias(true)
        try {
            const url = campoId
                ? `/api/telegram/lluvias?telegram_id=${tgId}&campo_id=${campoId}`
                : `/api/telegram/lluvias?telegram_id=${tgId}`
            const res = await fetch(url)
            const data = await res.json()
            if (res.ok) {
                setLluvias(data.lluvias || [])
            }
        } catch {
            // silencioso
        } finally {
            setLoadingLluvias(false)
        }
    }

    const handleDeleteLluvia = async () => {
        if (!selectedLluvia || !telegramIdRef.current) return
        setDeleting(true)
        try {
            const res = await fetch('/api/telegram/lluvia', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram_id: telegramIdRef.current,
                    lluvia_id: selectedLluvia.id
                })
            })
            if (res.ok) {
                setLluvias(prev => prev.filter(l => l.id !== selectedLluvia.id))
                setShowModal(false)
                setSelectedLluvia(null)
            }
        } catch {
            // silencioso
        } finally {
            setDeleting(false)
        }
    }

    // Cargar lluvias cuando cambia el campo seleccionado
    useEffect(() => {
        if (telegramIdRef.current && selectedCampo) {
            loadLluvias(telegramIdRef.current, selectedCampo)
        }
    }, [selectedCampo])




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

    // Si no hay telegram ID, mostrar error bloqueante
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
                {debugInfo && (
                    <p style={{ fontSize: '10px', color: colors.textDim, marginTop: '20px', fontFamily: 'monospace' }}>
                        Debug: {debugInfo}
                    </p>
                )}
            </div>
        )
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
                <span style={{ fontSize: '18px', fontWeight: 600 }}>Registrar lluvia</span>
            </div>

            <div style={{
                background: colors.card,
                borderRadius: '12px',
                border: `1px solid ${colors.cardBorder}`,
                padding: '20px'
            }}>
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
                        onChange={e => setSelectedCampo(Number(e.target.value))}
                        style={{
                            width: '100%',
                            height: '44px',
                            padding: '0 14px',
                            borderRadius: '8px',
                            background: colors.bg,
                            border: `1px solid ${colors.cardBorder}`,
                            color: colors.text,
                            fontSize: '14px'
                        }}
                    >
                        {campos.map(campo => (
                            <option key={campo.id} value={campo.id}>{campo.name}</option>
                        ))}
                    </select>
                </div>

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
                        Fecha
                    </label>
                    <input
                        type="date"
                        value={fecha}
                        onChange={e => setFecha(e.target.value)}
                        style={{
                            width: '100%',
                            height: '44px',
                            padding: '0 14px',
                            borderRadius: '8px',
                            background: colors.bg,
                            border: `1px solid ${colors.cardBorder}`,
                            color: colors.text,
                            fontSize: '14px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: colors.textMuted,
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Milímetros
                    </label>
                    <input
                        type="number"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        placeholder="Ej: 24"
                        value={mm}
                        onChange={e => setMm(e.target.value)}
                        step="0.1"
                        min="0"
                        style={{
                            width: '100%',
                            height: '44px',
                            padding: '0 14px',
                            borderRadius: '8px',
                            background: colors.bg,
                            border: `1px solid ${colors.cardBorder}`,
                            color: colors.text,
                            fontSize: '14px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

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

                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                        width: '100%',
                        height: '44px',
                        borderRadius: '8px',
                        background: submitting ? colors.cardBorder : colors.accent,
                        color: submitting ? colors.textDim : '#000',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        border: 'none'
                    }}
                >
                    {submitting ? 'Guardando...' : 'Guardar'}
                </button>

                {/* Lista de lluvias registradas */}
                {lluvias.length > 0 && (
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
                            <span>🌧️</span>
                            <span>Últimos registros</span>
                            {loadingLluvias && <span style={{ color: colors.textMuted, fontSize: '12px' }}>cargando...</span>}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {lluvias.slice(0, 5).map(lluvia => (
                                <div
                                    key={lluvia.id}
                                    onClick={() => { setSelectedLluvia(lluvia); setShowModal(true) }}
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
                                            {new Date(lluvia.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                        </div>
                                        <div style={{ fontSize: '12px', color: colors.textMuted }}>
                                            {lluvia.Campos?.name || campos.find(c => c.id === lluvia.campo_id)?.name || 'Campo'}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        color: colors.accent
                                    }}>
                                        {lluvia.milimetros}mm
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de confirmación */}
            {showModal && selectedLluvia && (
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
                            Registro de lluvia
                        </h3>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: colors.textMuted, fontSize: '13px' }}>Fecha:</span>
                                <span style={{ color: colors.text, fontSize: '13px' }}>
                                    {new Date(selectedLluvia.created_at).toLocaleDateString('es-AR')}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: colors.textMuted, fontSize: '13px' }}>Cantidad:</span>
                                <span style={{ color: colors.accent, fontSize: '13px', fontWeight: 600 }}>
                                    {selectedLluvia.milimetros}mm
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => { setShowModal(false); setSelectedLluvia(null) }}
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
                                onClick={handleDeleteLluvia}
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

export default function LluviaPage() {
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
            <LluviaForm />
        </Suspense>
    )
}
