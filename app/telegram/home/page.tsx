'use client'
import { useState, useEffect, useRef } from 'react'
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
    textDim: '#536471'
}

export default function HomePage() {
    const router = useRouter()
    const telegramIdRef = useRef<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [hasCampos, setHasCampos] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp
            tg.ready()
            tg.setHeaderColor(colors.bg)
            tg.setBackgroundColor(colors.bg)

            const tgId = tg.initDataUnsafe?.user?.id || null
            if (tgId) {
                telegramIdRef.current = tgId
                checkRegistration(tgId)
            } else {
                setLoading(false)
            }
        } else {
            setLoading(false)
        }
    }, [])

    const checkRegistration = async (tgId: number) => {
        try {
            // Primero verificar si está registrado
            const checkResponse = await fetch('/api/telegram/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: tgId })
            })
            const checkData = await checkResponse.json()

            // Si NO está registrado, redirigir a auth
            if (!checkData.registered) {
                router.replace('/telegram/auth')
                return
            }

            // Si está registrado, cargar campos
            const response = await fetch('/api/telegram/campos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: tgId })
            })
            const data = await response.json()

            setHasCampos(data.campos?.length > 0)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const ActionButton = ({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                aspectRatio: '1',
                borderRadius: '12px',
                background: disabled ? colors.card : colors.card,
                border: `1px solid ${disabled ? colors.cardBorder : colors.accent}`,
                color: disabled ? colors.textDim : colors.text,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.15s ease'
            }}
        >
            <div style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: disabled ? colors.textDim : colors.accent
            }}>
                {icon}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>{label}</span>
        </button>
    )

    const RainIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M16 14v6" /><path d="M8 14v6" /><path d="M12 16v6" />
        </svg>
    )
    const HarvestIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v8" /><path d="m4.93 10.93 1.41 1.41" /><path d="M2 18h2" /><path d="M20 18h2" />
            <path d="m19.07 10.93-1.41 1.41" /><path d="M22 22H2" /><path d="m8 22 4-10 4 10" />
        </svg>
    )
    const SprayIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
        </svg>
    )
    const SeedIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 20h10" /><path d="M10 20c5.5-2.5.8-6.4 3-10" />
            <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
            <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
        </svg>
    )
    const GearIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
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

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
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
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                maxWidth: '320px',
                marginBottom: '12px'
            }}>
                <div style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: colors.accent
                }}>
                    L2Agro
                </div>
                <button
                    onClick={() => router.push('/telegram/config')}
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
                    title="Configuración de campos"
                >
                    <GearIcon />
                </button>
            </div>

            {/* Subtítulo */}
            <p style={{
                fontSize: '13px',
                color: colors.textMuted,
                marginBottom: '24px',
                textAlign: 'center',
                maxWidth: '320px'
            }}>
                Registrar datos
            </p>

            {/* Grid de acciones */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                width: '100%',
                maxWidth: '320px'
            }}>
                <ActionButton
                    icon={<RainIcon />}
                    label="Lluvia"
                    onClick={() => router.push('/telegram/registrar/lluvia')}
                    disabled={!hasCampos}
                />
                <ActionButton
                    icon={<HarvestIcon />}
                    label="Cosecha"
                    onClick={() => router.push('/telegram/registrar/cosecha')}
                    disabled={!hasCampos}
                />
                <ActionButton
                    icon={<SprayIcon />}
                    label="Aplicación"
                    onClick={() => router.push('/telegram/registrar/aplicacion')}
                    disabled={!hasCampos}
                />
                <ActionButton
                    icon={<SeedIcon />}
                    label="Siembra"
                    onClick={() => router.push('/telegram/registrar/siembra')}
                    disabled={!hasCampos}
                />
            </div>

            {/* Mensaje si no tiene campos */}
            {!hasCampos && (
                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    borderRadius: '10px',
                    background: colors.accentDim,
                    border: `1px solid ${colors.accent}30`,
                    textAlign: 'center',
                    maxWidth: '320px'
                }}>
                    <p style={{ fontSize: '13px', color: colors.accent, margin: 0 }}>
                        Configurá tus campos en el ícono de ajustes para comenzar
                    </p>
                </div>
            )}
        </div>
    )
}
